const AWS = require('aws-sdk');
const utils = require('./utils.js');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

exports.OFFER_METHOD_ENLIST = "enlist";
exports.OFFER_METHOD_PUBLISH = "publishoffer";
exports.OFFER_METHOD_GET = "getoffers";
exports.OFFER_METHOD_REMOVE = "dropoffers";
exports.OFFER_EVENT_ONLINE = "onlineoffers";
exports.OFFER_EVENT_OFFLINE = "offlineoffers";
exports.OFFER_EVENT_ACCEPTED = "acceptedoffers";
exports.OFFER_EVENT_DECLINED = "declinedoffers";

exports.COMMS_METHOD_BIDPUSH = "bidpush"; // to push a bid using an offer id
exports.COMMS_METHOD_BIDPULL = "bidpull"; // to revoke a bid using an offer id
exports.COMMS_METHOD_BIDACCEPT = "bidaccept"; // not used
exports.COMMS_METHOD_MESSAGE = "message";

exports.COMMS_METHOD_XBIDPUSH = "xbidpush"; // to push a bid using a token
exports.COMMS_METHOD_XBIDPULL = "xbidpull"; // to revoke a bid using a token
exports.COMMS_METHOD_XBIDACCEPT = "xbidaccept";
exports.COMMS_METHOD_XMESSAGE = "xmessage";


/** utilities */
exports.getConnections = async () => {
    const params = {
        TableName: process.env.CONN_TABLE_NAME
    };
    try {
        return await ddb.scan(params).promise();
    } catch (e) {
        console.log('getConnections: ' + JSON.stringify(e));
        throw e;
    }
};

exports.getConnection = async (connectionId) => {
    const params = {
        Key: { connectionId },
        TableName: process.env.CONN_TABLE_NAME
    };
    try {
        var result = await ddb.get(params).promise();
        return result.Item;
    } catch (e) {
        console.log('getConnection failed: ' + JSON.stringify(e));
        throw e;
    }
};

exports.putConnection = async (connection) => {
    const params = {
        TableName: process.env.CONN_TABLE_NAME,
        Item: connection
    };
    try {
        await ddb.put(params).promise();
        console.log('putConnection: ' + JSON.stringify(params));
    } catch (e) {
        console.log('putConnection failed: ' + JSON.stringify(e));
        throw e;
    }
    return connection;
};


exports.getTrace = async (token) => {
    const params = {
        Key: { token },
        TableName: process.env.TRACE_TABLE_NAME
    };
    console.log('getTrace'+JSON.stringify(params));
    try {
        var result = await ddb.get(params).promise();
        return result.Item;
    } catch (e) {
        console.log('getTrace failed: ' + JSON.stringify(e));
        throw e;
    }
};

exports.putTrace = async (trace) => {
    const params = {
        TableName: process.env.TRACE_TABLE_NAME,
        Item: trace
    };
    try {
        await ddb.put(params).promise();
    } catch (e) {
        console.log('putTrace failed: ' + JSON.stringify(e));
        throw e;
    }
    return trace;
};

exports.hashToken = async (offer) => {
    var _offer = Object.assign({}, offer);
    _offer.token = utils.sha256(_offer.token);
    _offer.xbids = (_offer.xbids === undefined || !_offer.xbids) ?
        [] :
        _offer.xbids.map(xbid => xbid.token = "");
    return _offer;
};

exports.getOffer = async (offerId) => {
    try {
        var params = {
            Key: { offerId },
            TableName: process.env.OFFER_TABLE_NAME
        };
        var result = await ddb.get(params).promise();
        return result.Item;
    } catch (e) {
        console.log('getOffer failed: ' + JSON.stringify(e));
        throw e;
    }
};

exports.putOffer = async (offer) => {
    try {
        const params = {
            TableName: process.env.OFFER_TABLE_NAME,
            Item: offer
        };
        await ddb.put(params).promise();
    } catch (e) {
        console.log('putOffer failed: ' + JSON.stringify(e));
        throw e;
    }
};

exports.getValidPublicOffers = async () => {
    const params = {
        TableName: process.env.OFFER_TABLE_NAME
    };
    try {
        var result = await ddb.scan(params).promise();
        if (result.Items) {
            var today = new Date().getTime();
            var offers = result.Items.filter(c => c.expired >= today);
            // remove non-public data:
            offers = offers.map(offer => this.hashToken(offer));
            return offers;
        }
    } catch (e) {
        console.log('getValidOffers failed: ' + JSON.stringify(e));
        throw e;
    }
};

exports.getOffersByIds = async (offerIds) => {
    var getCalls = (offerIds ?? []).map(async id => await this.getOffer(id));
    const offers = await Promise.all(getCalls);
    return offers;
};

exports.getOffersByToken = async (token) => {
    const params = {
        Key: { token },
        TableName: process.env.TRACE_TABLE_NAME
    };
    try {
        var result = await ddb.get(params).promise();
        if (result.Item) {
            var offers = await this.getOffersByIds(result.Item.offers);
            return offers;
        }
        return [];
    } catch (e) {
        console.log('getOfferByToken failed: ' + JSON.stringify(e));
        throw e;
    }
}

exports.broadcastPostCalls = async (postCalls) => {
    try {
        await Promise.all(postCalls);
    } catch (e) {
        console.log('broadcastPostCalls: ' + JSON.stringify(e));
        throw e;
    }
};

exports.postToConnection = async (apigwManagementApi, connectionId, payload) => {
    try {
        if (!connectionId || connectionId === undefined || connectionId.length === 0)
            throw new Error('no connection to post to')
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) }).promise();
    } catch (e) {

        if (e.statusCode === 410) {
            console.log(`Found stale connection, deleting ${connectionId}`);
            await this.offline(apigwManagementApi, connectionId, false); // won't notify other users to avoid spamming and recursion
        } else if (e.statusCode === 400) {
            console.log(`Found invalid connection, deleting ${connectionId}`);
            await this.offline(apigwManagementApi, connectionId, false); // won't notify other users to avoid spamming and recursion
        } else {
            console.log('postToConnection: ' + (e.message || JSON.stringify(e)));
        }
    }
};


/** method handlers */
exports.broadcastOffersDelete = async (apigwManagementApi, offerIds) => {
    const connections = await this.getConnections();
    await this.broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        const payload = { code: this.OFFER_METHOD_REMOVE, offerIds };
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) }).promise();
        } catch (e) {
            //skip exception
        }
    }));
};

exports.broadcastOffersOnline = async (apigwManagementApi, offerIds, ownerConnectionId, online) => {
    const connections = await this.getConnections();
    await this.broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        const payload = {
            code: online ? this.OFFER_EVENT_ONLINE : this.OFFER_EVENT_OFFLINE,
            offerIds, connectionId: ownerConnectionId};
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) }).promise();
        } catch (e) {
            //skip exception
        }
    }));
};

exports.broadcastOffersAccepted = async (apigwManagementApi, offerIds, accepted) => {
    const connections = await this.getConnections();
    await this.broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        const payload = {
            code: accepted ? this.OFFER_EVENT_ACCEPTED : this.OFFER_EVENT_DECLINED,
            offerIds };
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) }).promise();
        } catch (e) {
            //skip exception
        }
    }));
};


exports.setOffersConnectionId = async (offers, connectionId) => {
    try {
        var putCalls = offers.map(async offer => {
                offer.connectionId = connectionId;
                await ddb.put({ TableName: process.env.OFFER_TABLE_NAME, Item: offer }).promise();
            });
        await Promise.all(putCalls);

    } catch (e) {
        console.log('setOffersOnline failed: ' + JSON.stringify(e));
    }
};

exports.deleteOffers = async (apigwManagementApi, connectionId, offerIds, notify) => {

    try {
        const connection = await this.getConnection(connectionId);
        const trace = await this.getTrace(connection.token);
        var delCalls = offerIds.map(async offerId => {
            const offer  = await this.getOffer(offerId);
            if (offer.token !== connection.token || connection.token !== trace.token) return;

            const params = {
                TableName: process.env.OFFER_TABLE_NAME,
                Key: { offerId }
            };

            await ddb.delete(params).promise();

            const delIdx = trace.offers.findIndex(f => f === offerId);
            trace.offers.splice(delIdx, 1);
        });

        await Promise.all(delCalls);

        this.putTrace(trace);

        if (notify) {
            await this.broadcastOffersDelete(apigwManagementApi, offerIds);
        }
    } catch (e) {
        console.log('deleteOffers failed: ' + JSON.stringify(e));
        throw e;
    }
};

exports.offline = async (apigwManagementApi, connectionId, notify) => {
    const connection = await this.getConnection(connectionId);
    const trace = await this.getTrace(connection.token);
    const offers = await this.getOffersByIds(trace.offers);

    try {
        trace.connectionId = "";
        await ddb.put({ TableName: process.env.TRACE_TABLE_NAME, Item: trace }).promise();
        await this.setOffersConnectionId(offers, trace.connectionId);
        await ddb.delete({ TableName: process.env.CONN_TABLE_NAME, Key: { connectionId } }).promise();
        if (notify) {
            await this.broadcastOffersOnline(apigwManagementApi, trace.offers, "", false);
        }
    } catch (e) {
        console.log('offline failed: ' + JSON.stringify(e));
        // skipping this ex
    }
};
