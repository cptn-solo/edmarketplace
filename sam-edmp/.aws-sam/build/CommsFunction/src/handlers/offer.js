const AWS = require('aws-sdk');
const shared = require('../shared/shared.js');

const BROADCAST_BATCH_SIZE = 20; // offers per broadcast

exports.offer = async event => {
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    try {
        console.log('request body: ' + event.body);
        const eventBody = JSON.parse(event.body);
        const connectionid = event.requestContext.connectionId;

        // switch method being called
        switch (eventBody.data.method) {
            case shared.OFFER_METHOD_ENLIST:
                // 1. recall user's trace or create new one for him
                const trace = await getOrCreateUserTrace(connectionid, eventBody.data.payload.token);
                // 2. post last known user's offer back to him
                const offers = await postEnlistResponce(apigwManagementApi, trace);
                // 3. post notify connected users on offer went online
                await broadcastOfferWentOnline(apigwManagementApi, trace);
                return { statusCode: 200, body: JSON.stringify({ trace, offers })};
            case shared.OFFER_METHOD_PUBLISH:
                // 1. store new/updated offer data
                const offer = await publishOffer(connectionid, eventBody.data.payload);
                // 2. broadcast this offer to all connected users
                await broadcastOffer(apigwManagementApi, offer);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.OFFER_METHOD_GET:
                const offers = await postAllOffersToConnection(apigwManagementApi, connectionid);
                return { statusCode: 200, body: JSON.stringify({ offers })};
            case shared.OFFER_METHOD_REMOVE:
                await shared.deleteOffers(apigwManagementApi, connectionid, eventBody.data.payload.offerIds, true); // notify all users
                return { statusCode: 200, body: JSON.stringify({})};
            default:
                return { statusCode: 500, body: eventBody.data.method + ' method not supported' };
        }
    } catch (e) {
        console.log('failed request body: ' + event.body + ' stack: ' + JSON.stringify(e));
        return { statusCode: 500, body: 'failed request body: ' + event.body + ' : ' + JSON.stringify(e) };
    }
};

/** method handlers*/
async function getOrCreateUserTrace(connectionId, token) {
    var connection = await shared.getConnection(connectionId);
    var _trace = null;
    var _token = token.length > 0 ? token : connection.token;
    var _offers = [];
    if (token.length > 0) {
        connection.token = _token;
        await shared.putConnection(connection);
    }
    _trace = await shared.getTrace(_token);

    if (trace) {
        _offers = trace.offers??[];
    }
    trace = await shared.putTrace({ connectionId, token: _token, offers: _offers });
    return trace;
}

async function postEnlistResponce(apigwManagementApi, trace) {
    const offers = await shared.getOffersByIds(trace.offers);
    const payload = { code: shared.OFFER_METHOD_ENLIST, trace, offers };
    await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) }).promise();
    return offers;
}

async function broadcastOfferWentOnline(apigwManagementApi, trace) {
    shared.broadcastOffersOffline(apigwManagementApi, trace.offers, trace.connectionId);
}

async function postAllOffersToConnection(apigwManagementApi, connectionId) {
    const offers = await shared.getValidPublicOffers();
    var page = 0;
    var ofpages = parseInt(offers.length / BROADCAST_BATCH_SIZE) + ((offers.length % BROADCAST_BATCH_SIZE) ? 1 : 0);
    var postcalls = [];
    while (offers.length > 0) {
        const batch = offers.splice(0, BROADCAST_BATCH_SIZE);
        const payload = { code: shared.OFFER_METHOD_GET, batch, page, ofpages };
        postcalls.push(payload);
        page ++;
    }
    await shared.broadcastPostCalls(postcalls.map(async (batch) => {
        await postOfferToConnection(apigwManagementApi, connectionId, batch);
    }));
    return offers;
}

async function postOfferToConnection(apigwManagementApi, connectionId, offer) {
    try {
        const payload = {
            code: shared.OFFER_METHOD_PUBLISH,
            offer: Object.assign(offer, {
                token: "",
            })
        }
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) }).promise();
    } catch (e) {
        if (e.statusCode === 410) {
            console.log(`Found stale connection, deleting ${connectionId}`);
            await shared.offline(apigwManagementApi, connectionId, false); // won't notify other users to avoid spamming and recursion
        } else if (e.statusCode === 400) {
            console.log(`Found invalid connection, deleting ${connectionId}`);
            await shared.offline(apigwManagementApi, connectionId, false); // won't notify other users to avoid spamming and recursion
        } else {
            console.log('postOfferToConnection: ' + JSON.stringify(e));
            throw e;
        }
    }
}

async function broadcastOffer(apigwManagementApi, offer) {
    const connections = await shared.getCurrentConnectionIds();
    await shared.broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        try {
            const payload = {
                code: shared.OFFER_METHOD_PUBLISH,
                offer
            }
            await postOfferToConnection(apigwManagementApi, connectionId, payload);
        } catch (e) {
            // skip
        }
    }));
}

async function publishOffer(connectionId, offer) {
    try {
        const connection = await shared.getConnection(connectionId);
        const trace = await shared.getTrace(connection.token);
        const _offer = Object.assign({
            connectionId: connectionId,
            token: trace.token
        }, offer);
        await shared.putOffer(_offer);
    } catch (e) {
        console.log('publishOffer failed: ' + JSON.stringify(e));
        throw e;
    }

    return _offer;
}
