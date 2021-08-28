const AWS = require('aws-sdk');
const shared = require('../shared/shared.js');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const {
    CONN_TABLE_NAME,
    TRACE_TABLE_NAME,
    OFFER_TABLE_NAME } = process.env;

exports.comms = async event => {
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
            case shared.COMMS_METHOD_BIDPUSH:
                await addOrRemoveBid(apigwManagementApi, connectionid,
                    eventBody.data.payload.token, eventBody.data.payload.offerId, true);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_BIDPULL:
                await addOrRemoveBid(apigwManagementApi, connectionid,
                    eventBody.data.payload.token, eventBody.data.payload.offerId, false);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_MESSAGE:
                await forwardMessage(apigwManagementApi, connectionid,
                    eventBody.data.payload.token, eventBody.data.payload.message);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            default:
                return { statusCode: 500, body: eventBody.data.method + ' method not supported' };
        }
    } catch (e) {
        console.log('failed request body: ' + event.body + ' stack: ' + JSON.stringify(e));
        return { statusCode: 500, body: 'failed request body: ' + event.body + ' : ' + JSON.stringify(e) };
    }
};

async function forwardMessage (apigwManagementApi, connectionId, token, message) {
    const trace = await shared.getTrace(token);

    try {
        if (trace.offers.length === 0)
            throw new Error('no my offer');

        const offer = await shared.getOffer(message.offerId);

        if (!offer)
            throw new Error('no their offer');

        if (offer.connectionId.length === 0)
            throw new Error('only online allowed');

        if (!offer.bids || offer.bids === undefined || offer.bids.length === 0)
            throw new Error('no bids on their offer yet');

        // default offer untill multioffer implementation. for now only multiitem
        // implemented (one offer per user, any supply:demand pairs per offer)
        const myOfferId = trace.offers[0];
        const idx1 = offer.bids.findIndex(b => b === myOfferId);
        if (idx1 < 0)
            throw new Error('no my bid for this offer');

        const myoffer = await shared.getOffer(myOfferId);

        if (!myoffer.bids || myoffer.bids === undefined || myoffer.bids.length === 0)
            throw new Error('no bids on my offer yet');

        const idx2 = myoffer.bids.findIndex(b => b === offer.offerId);
        if (idx2 < 0)
            throw new Error('no his bid for my offer');

        /* both bids present, can forward chat message: */

        message.offerId = myOfferId; // message will drop on my offer for him
        const code = shared.COMMS_METHOD_MESSAGE;
        const payload = { code, message };
        await shared.postToConnection(apigwManagementApi, offer.connectionId, payload);

        console.log('forwardMessage: ' + JSON.stringify(payload));

    } catch (e) {
        console.log('forwardMessage failed: ' + e.message)
        return false;
    }

    return true;
};

async function addOrRemoveBid (apigwManagementApi, connectionId, token, offerId, addMode) {
    const trace = await shared.getTrace(token);

    if (trace.offers.length === 0) return false; // no my offer

    const offer = await shared.getOffer(offerId);

    if (!offer) return false; // no their offer

    // default offer untill multioffer implementation. for now only multiitem
    // implemented (one offer per user, any supply:demand pairs per offer)
    const myOfferId = trace.offers[0];
    if (!offer.bids || offer.bids === undefined) {
        offer.bids = [];
    }
    const idx = offer.bids.findIndex(b => b === myOfferId);
    if (idx < 0 && addMode) {
        offer.bids.push(myOfferId);
    } else if (idx >= 0 && !addMode) {
        offer.bids.splice(idx, 1);
        // TODO: leave this method to prevent spamming.
        // for now just for debug purposes we push event to parties even
        // if a bid already added to an offer
    } else {
        return false; // no need to communicate
    }
    await shared.putOffer(offer);
    const code = addMode ? shared.COMMS_METHOD_BIDPUSH : shared.COMMS_METHOD_BIDPULL;
    const payload = { code , offer };
    // both sides should get notified about bid being placed/removed
    await Promise.all([
        shared.postToConnection(apigwManagementApi, offer.connectionId, payload),
        shared.postToConnection(apigwManagementApi, connectionId, payload)
    ]);

    return true;
};
