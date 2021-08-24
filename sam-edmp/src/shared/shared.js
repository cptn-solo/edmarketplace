const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

exports.OFFER_METHOD_ENLIST = "enlist";
exports.OFFER_METHOD_PUBLISH = "publishoffer";
exports.OFFER_METHOD_GET = "getoffers";
exports.OFFER_METHOD_REMOVE = "dropoffers";
exports.OFFER_EVENT_ONLINE = "onlineoffers";
exports.OFFER_EVENT_OFFLINE = "offlineoffers";

exports.COMMS_METHOD_BIDPUSH = "bidpush";
exports.COMMS_METHOD_BIDPULL = "bidpull";
exports.COMMS_METHOD_BIDACCEPT = "bidaccept";
exports.COMMS_METHOD_MESSAGE = "message";


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
}


exports.getTrace = async (token) => {
    const params = {
        Key: { token },
        TableName: process.env.TRACE_TABLE_NAME
    };
    console.log('getTrace'+JSON.stringify(params));
    try {
        var result = await ddb.get(params).promise();
        return result.Item
    } catch (e) {
        console.log('getTrace failed: ' + JSON.stringify(e));
        throw e;
    }
}

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
}

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
            offers = offers.map(offer => Object.assign(offer, { token: "" }));
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
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) }).promise();
    } catch (e) {

        if (e.statusCode === 410) {
            console.log(`Found stale connection, deleting ${connectionId}`);
            await this.offline(apigwManagementApi, connectionId, false); // won't notify other users to avoid spamming and recursion
        } else if (e.statusCode === 400) {
            console.log(`Found invalid connection, deleting ${connectionId}`);
            await this.offline(apigwManagementApi, connectionId, false); // won't notify other users to avoid spamming and recursion
        } else {
            console.log('postToConnection: ' + JSON.stringify(e));
            throw e;
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

exports.broadcastOffersOffline = async (apigwManagementApi, offerIds) => {
    const connections = await this.getConnections();
    await this.broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        const payload = {
            code: this.OFFER_EVENT_OFFLINE,
            offerIds };
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) }).promise();
        } catch (e) {
            //skip exception
        }
    }));
};

exports.broadcastOffersOnline = async (apigwManagementApi, offerIds, ownerConnectionId) => {
    const connections = await this.getConnections();
    await this.broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        const payload = {
            code: this.OFFER_EVENT_ONLINE,
            offerIds, connectionId: ownerConnectionId};
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) }).promise();
        } catch (e) {
            //skip exception
        }
    }));
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
        console.log('deleteOffers: ' + JSON.stringify(e));
        throw e;
    }
};

exports.offline = async (apigwManagementApi, connectionId, notify) => {
    const connection = await this.getConnection(connectionId);
    console.log('connection: '+JSON.stringify(connection));
    const trace = await this.getTrace(connection.token);
    console.log('trace: '+JSON.stringify(trace));
    const offers = await this.getOffersByIds(trace.offers);
    console.log('offers: '+JSON.stringify(offers));

    try {
        trace.connectionId = "";
        await ddb.put({ TableName: process.env.TRACE_TABLE_NAME, Item: trace }).promise();
        var putCalls = offers.map(async offer => {
            offer.connectionId = "";
            await ddb.put({ TableName: process.env.OFFER_TABLE_NAME, Item: offer }).promise();
        });
        await Promise.all(putCalls);
        await ddb.delete({ TableName: process.env.CONN_TABLE_NAME, Key: { connectionId } }).promise();
        if (notify) {
            await this.broadcastOffersOffline(apigwManagementApi, trace.offers);
        }
    } catch (e) {
        console.log('offline failed: ' + JSON.stringify(e));
        // skipping this ex
    }
};
