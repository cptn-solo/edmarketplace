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
                await addOrRemoveBid(apigwManagementApi, connectionid, eventBody.data.payload.token, eventBody.data.payload.offerId, true);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_BIDPULL:
                await addOrRemoveBid(apigwManagementApi, connectionid, eventBody.data.payload.token, eventBody.data.payload.offerId, false);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_BIDACCEPT:
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_MESSAGE:
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            default:
                return { statusCode: 500, body: eventBody.data.method + ' method not supported' };
        }
    } catch (e) {
        console.log('failed request body: ' + event.body + ' stack: ' + JSON.stringify(e));
        return { statusCode: 500, body: 'failed request body: ' + event.body + ' : ' + JSON.stringify(e) };
    }
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
    const payload = { code: shared.COMMS_METHOD_BIDPUSH, offer };
    // both sides should get notified about bid being placed/removed
    await Promise.all([
        shared.postToConnection(apigwManagementApi, offer.connectionId, payload),
        shared.postToConnection(apigwManagementApi, connectionId, payload)
    ]);

    return true;
};
