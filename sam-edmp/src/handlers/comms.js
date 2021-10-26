const AWS = require('aws-sdk');
const shared = require('../shared/shared.js');
const utils = require('../shared/utils.js');

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
                    eventBody.data.payload.offerId,
                    eventBody.data.payload.myOfferId, true);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_BIDPULL:
                await addOrRemoveBid(apigwManagementApi, connectionid,
                    eventBody.data.payload.offerId,
                    eventBody.data.payload.myOfferId, false);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_MESSAGE:
                await forwardMessage(apigwManagementApi, connectionid,
                    eventBody.data.payload.message);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_XBIDPUSH:
                await addOrRemoveXBid(apigwManagementApi, connectionid,
                    eventBody.data.payload.offerId, true);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_XBIDPULL:
                await addOrRemoveXBid(apigwManagementApi, connectionid,
                    eventBody.data.payload.offerId, false);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_XBIDACCEPT:
                await acceptOrDeclineXBid (apigwManagementApi, connectionid,
                    eventBody.data.payload.offerId, // offer bein processed
                    eventBody.data.payload.tokenhash, // hashed token of the other party to accept/decline
                    eventBody.data.payload.accept); // true/false for accept/decline
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case shared.COMMS_METHOD_XMESSAGE:
                await forwardXMessage(apigwManagementApi, connectionid,
                    eventBody.data.payload.message);
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            default:
                return { statusCode: 500, body: eventBody.data.method + ' method not supported' };
        }
    } catch (e) {
        console.log('failed request body: ' + event.body + ' stack: ' + JSON.stringify(e));
        return { statusCode: 500, body: 'failed request body: ' + event.body + ' : ' + JSON.stringify(e) };
    }
};

async function forwardMessage (apigwManagementApi, connectionId, message) {
    const connection = await shared.getConnection(connectionId);
    const trace = await shared.getTrace(connection.token);

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

        const myOfferId = message.myOfferId;
        console.log('message: my offer id: '+myOfferId);
        console.log('message: offer bids: '+JSON.stringify(offer.bids));
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

        message.myOfferId = message.offerId; // message will drop on my offer for him
        message.offerId = myOfferId; // message will drop on my offer for him

        const code = shared.COMMS_METHOD_MESSAGE;
        const payload = { code, message };
        await shared.postToConnection(apigwManagementApi, offer.connectionId, payload);

        console.log('forwardMessage: ' + JSON.stringify(payload));

    } catch (e) {
        console.log('forwardMessage failed: ' + e.message);
        return false;
    }

    return true;
}

async function addOrRemoveBid (apigwManagementApi, connectionId, offerId, myOfferId, addMode) {
    const connection = await shared.getConnection(connectionId);
    const trace = await shared.getTrace(connection.token);

    try {
        if (trace.offers.length === 0)
            throw new Error('no my offer');

        const offer = await shared.getOffer(offerId);

        if (!offer)
            throw new Error('no their offer');

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
            throw new Error('no need to communicate');
        }
        await shared.putOffer(offer);
        const code = addMode ? shared.COMMS_METHOD_BIDPUSH : shared.COMMS_METHOD_BIDPULL;
        const payload = { code , offer };
        // both sides should get notified about bid being placed/removed
        await Promise.all([
            shared.postToConnection(apigwManagementApi, offer.connectionId, payload),
            shared.postToConnection(apigwManagementApi, connectionId, payload)
        ]);
    } catch (e) {
        console.log('addOrRemoveBid failed: ' + e.message);
        return false;
    }

    return true;
}

/* Support for implicit bids (bid with bidder token instead of bidder offer) */

async function addOrRemoveXBid (apigwManagementApi, connectionId, offerId, addMode) {

    const connection = await shared.getConnection(connectionId);

    try {

        const offer = await shared.getOffer(offerId);

        if (!offer)
            throw new Error('no their offer');

        if (!offer.xbids || offer.xbids === undefined) {
            offer.xbids = [];
        }
        const idx = offer.xbids.findIndex(b => b.token === connection.token);
        if (idx < 0 && addMode) {
            const timestamp = new Date().getTime();
            offer.xbids.push({
                token: connection.token,
                tokenhash: utils.sha256(connection.token), // precalculate for future use
                timestamp, // bid timestamp so we can find 1st one
                accepted: false });
        } else if (idx >= 0 && !addMode) {
            offer.xbids.splice(idx, 1);
            // TODO: leave this method to prevent spamming.
            // for now just for debug purposes we push event to parties even
            // if a bid already added to an offer
        } else {
            throw new Error('no need to communicate');
        }
        await shared.putOffer(offer);
        const code = addMode ? shared.COMMS_METHOD_XBIDPUSH : shared.COMMS_METHOD_XBIDPULL;
        const payload = { code , offer: shared.hashToken(offer) };
        // both sides should get notified about bid being placed/removed
        console.log('addOrRemoveXBid: '+ JSON.stringify(payload));

        const connections = await shared.getConnections();
        await shared.broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
            try {
                await shared.postToConnection(apigwManagementApi, connectionId, payload);
            } catch (e) {
                // skip
            }
        }));

        await Promise.all([
            shared.postToConnection(apigwManagementApi, offer.connectionId, payload),
            shared.postToConnection(apigwManagementApi, connectionId, payload)
        ]);
    } catch (e) {
        console.log('addOrRemoveBid failed: ' + e.message);
        return false;
    }

    return true;
}

async function acceptOrDeclineXBid (apigwManagementApi, connectionId, offerId, tokenhash, accept) {

    const connection = await shared.getConnection(connectionId);

    try {

        const offer = await shared.getOffer(offerId);

        if (!offer)
            throw new Error('no my offer');

        if (offer.token !== connection.token)
            throw new Error('offer ownership required');

        if (!offer.xbids || offer.xbids === undefined) {
            offer.xbids = [];
        }
        const idx = offer.xbids.findIndex(b => b.tokenhash === tokenhash);
        var notifyTrace = null;
        if (idx >= 0) {
            var xbid = offer.xbids[idx];
            xbid.accepted = accept;
            offer.xbids[idx] = xbid;
            notifyTrace = await shared.getTrace(xbid.token);
        } else {
            throw new Error('no xbid to accept');
        }
        await shared.putOffer(offer);
        const code = shared.COMMS_METHOD_XBIDACCEPT;
        const payload = { code, offer: shared.hashToken(offer) };
        // both sides should be notified about bid being accepted/declined
        await Promise.all([
            shared.postToConnection(apigwManagementApi, connectionId, payload),
            shared.postToConnection(apigwManagementApi, notifyTrace ? notifyTrace.connectionId : "", payload)
        ]);
        await shared.broadcastOffersAccepted(apigwManagementApi, [offerId], accept);
    } catch (e) {
        console.log('acceptXBid failed: ' + e.message);
        return false;
    }

    return true;
}

/*
    message - {
        tokenhash - hashed token of a party being communicated (required if 
                    a message is being sent to a bidder),
        offerId - id of an offer in scope of current negotiation,
        date - timestamp of the message from the client,
        text - message text
    }

    will forward the `message` object by setting a `tokenhash` field
    to sender's hashed token value to let the receiver know the sender
*/
async function forwardXMessage (apigwManagementApi, connectionId, message) {

    const connection = await shared.getConnection(connectionId);

    try {

        const offer = await shared.getOffer(message.offerId);

        if (!offer)
            throw new Error('no offer in context of the negotiation');

        if (offer.connectionId.length === 0)
            throw new Error('only online allowed');

        if (!offer.xbids || offer.xbids === undefined || offer.xbids.length === 0)
            throw new Error('no xbids on their offer yet');

        console.log('message: offer xbids: '+JSON.stringify(offer.xbids));

        // check if the offer is mine
        const isMyOffer = offer.token === connection.token;

        const idx1 = offer.xbids.findIndex(b => isMyOffer ?
            b.tokenhash === message.tokenhash :
            b.token === connection.token);

        if (idx1 < 0)
            throw new Error('no their xbid for my offer');

        const xbid = offer.xbids[idx1];

        if (!xbid.accepted)
            throw new Error('xbid is not yet accepted');

        /* xbid accepted, can forward chat message: */

        const code = shared.COMMS_METHOD_XMESSAGE;
        const payload = {
            code,
            message: Object.assign(message, {
                tokenhash: utils.sha256(connection.token)
            })
        };
        console.log('forwardMessage: ' + JSON.stringify(payload));

        if (isMyOffer) { // find bidder's trace and send a message if trace is online
            const bidder = await shared.getTrace(xbid.token);
            if (!bidder)
                throw new Error('xbid from unknown trace, stale data');

            if (!bidder.connectionId || bidder.connectionId.length === 0)
                throw new Error('xbid owner is offline');

            await shared.postToConnection(apigwManagementApi, bidder.connectionId, payload);

        } else { // send a message to an offer's current connection

            await shared.postToConnection(apigwManagementApi, offer.connectionId, payload);

        }

        // send a message back to sender to assure the message was sent to a receiver
        // and for client to be able to log the message as it may need to
        await shared.postToConnection(apigwManagementApi, connectionId, payload);


    } catch (e) {
        console.log('forwardMessage failed: ' + e.message);
        return false;
    }

    return true;
}
