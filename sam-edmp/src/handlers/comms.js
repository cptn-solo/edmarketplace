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
                await bidOnOffer(apigwManagementApi, connectionid, eventBody.data.payload.token, eventBody.data.payload.offerId);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_BIDPULL:
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

async function bidOnOffer (apigwManagementApi, connectionId, token, offerId) {
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
    if (idx < 0) {
        offer.bids.push(myOfferId);
    }
    await shared.putOffer(offer);
    const payload = { code: shared.COMMS_METHOD_BIDPUSH, offer };
    if (offer.connectionId.length > 0) {
        await shared.postToConnection(apigwManagementApi, offer.connectionId, payload);
    }

    return true;
};
