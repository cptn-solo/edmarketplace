const AWS = require('aws-sdk');
const shared = require('../shared/shared.js');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const { TABLE_NAME } = process.env;

const OFFER_METHOD_PUBLISH = "publishoffer";
const OFFER_METHOD_GET = "getoffers";
const OFFER_METHOD_REMOVE = "removeoffer";
const OFFER_METHOD_ENLIST = "enlist";
// debug: remove later:
const OFFER_METHOD_READ = "readoffers";

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
            case OFFER_METHOD_PUBLISH:
                // 1. store new/updated offer data
                const partyOffer = await publishOffer(connectionid, eventBody.data.payload);
                // 2. broadcast this offer to all connected users
                await postOfferToAllConnections(apigwManagementApi, partyOffer);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case OFFER_METHOD_GET:
                const offers = await postAllOffersToConnection(apigwManagementApi, connectionid);
                return { statusCode: 200, body: JSON.stringify({ offers })};
            case OFFER_METHOD_ENLIST:
                // 1. recall user's trace or create new one for him
                const currentToken = await getOrCreateUserTrace(connectionid, eventBody.data.payload.token);
                // 2. post last known user's offer back to him
                const myOffer = await postMyOfferToConnection(apigwManagementApi, connectionid, currentToken);
                return { statusCode: 200, body: JSON.stringify({ myOffer })};
            case OFFER_METHOD_REMOVE:
                await shared.deleteOffer(apigwManagementApi, connectionid, true); // notify all users
                return { statusCode: 200, body: JSON.stringify({})};
            case OFFER_METHOD_READ:
                const connections = await ddb.scan({ TableName: TABLE_NAME }).promise();
                const message = JSON.stringify(connections);
                console.log('connections: ' + message);
                return { statusCode: 200, body: message };
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
    if (token.length > 0) {
        await shared.putUserTraceTokenForConnectionId(connectionId, token);
        return token;
    }
    return await shared.getUserTraceTokenByConnectionId(connectionId);
}

async function postMyOfferToConnection(apigwManagementApi, connectionId, token) {
    const myoffer = await shared.getOfferByToken(token);
    myoffer.connectionid = connectionId; // new connection id for object saved in earlier session
    const paiload = { myoffer, token };
    await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(paiload) }).promise();
}

async function postAllOffersToConnection(apigwManagementApi, connectionId) {
    const connections = await ddb.scan({ TableName: TABLE_NAME }).promise();
    var offers = connections.Items.filter(c => !!c.offer);
    var page = 0;
    var ofpages = parseInt(offers.length / BROADCAST_BATCH_SIZE) + ((offers.length % BROADCAST_BATCH_SIZE) ? 1 : 0);
    var postcalls = [];
    while(offers.length > 0) {
        const batch = offers.splice(0, BROADCAST_BATCH_SIZE);
        const payload = { batch, page, ofpages };
        postcalls.push(payload);
        page ++;
    }
    await shared.broadcastPostCalls(postcalls.map(async (batch) => {
        await postOfferToConnection(apigwManagementApi, connectionId, batch);
    }));
    return offers;
}

async function postOfferToConnection(apigwManagementApi, connectionId, partyOffer) {
    try {
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(partyOffer) }).promise();
    } catch (e) {
        if (e.statusCode === 410) {
            console.log(`Found stale connection, deleting ${connectionId}`);
            await shared.delist(apigwManagementApi, connectionId, false); // won't notify other users to avoid spamming and recursion
        } else if (e.statusCode === 400) {
            console.log(`Found invalid connection, deleting ${connectionId}`);
            await shared.delist(apigwManagementApi, connectionId, false); // won't notify other users to avoid spamming and recursion
        } else {
            console.log('postOfferToConnection: ' + JSON.stringify(e));
            throw e;
        }
    }
}

async function postOfferToAllConnections(apigwManagementApi, partyOffer) {
    const connections = await shared.getCurrentConnectionIds();
    await shared.broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        await postOfferToConnection(apigwManagementApi, connectionId, partyOffer);
    }));
}

async function publishOffer(connectionId, offerData) {
    const partyOffer = {
        connectionId: connectionId,
        offer: offerData
    }

    const putParams = {
        TableName: process.env.TABLE_NAME,
        Item: partyOffer
    };

    try {
        await ddb.put(putParams).promise();
    } catch (e) {
        console.log('publishOffer: ' + JSON.stringify(e));
        throw e;
    }

    return partyOffer;
}
