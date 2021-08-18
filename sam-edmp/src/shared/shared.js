const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

/** utilities */
exports.getCurrentConnectionIds = async () => {
    try {
        return await ddb.scan({ TableName: process.env.CONN_TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
    } catch (e) {
        console.log('getCurrentConnectionIds: ' + JSON.stringify(e));
        throw e;
    }
};

exports.getUserTraceTokenByConnectionId = async (connectionId) => {
    try {
        var params = {
            Key: { connectionId },
            TableName: process.env.CONN_TABLE_NAME
        };
        console.log('getUserTraceTokenByConnectionId params: ' + JSON.stringify(params));
        var result = await ddb.get(params).promise();
        return result.Item.token;
    } catch (e) {
        console.log('getUserTraceTokenByConnectionId failed: ' + JSON.stringify(e));
        throw e;
    }
};

exports.putUserTraceTokenForConnectionId = async (connectionId, token) => {
    const putParams = {
        TableName: process.env.CONN_TABLE_NAME,
        Item: { connectionId, token }
    };

    try {
        await ddb.put(putParams).promise();
    } catch (e) {
        console.log('putUserTraceTokenForConnectionId: ' + JSON.stringify(e));
        throw e;
    }
}

exports.getOfferByToken = async (token) => {
    try {
        var params = {
            Key: { token },
            TableName: process.env.TRACE_TABLE_NAME
        };
        console.log('getOfferByToken params: ' + JSON.stringify(params));
        var result = await ddb.get(params).promise();
        return result.Item;
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

/** method handlers */
exports.postOfferDeleteToAllConnections = async (apigwManagementApi, deletedConnectionId) => {
    // only stale connection id can be broadcasted in this case
    const connections = await this.getCurrentConnectionIds();
    await this.broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        const paiload = { dropoffer: deletedConnectionId };
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(paiload) }).promise();
    }));
};

exports.deleteOffer = async (apigwManagementApi, connectionId, notify) => {
    const putParams = {
        TableName: process.env.TABLE_NAME,
        Item: { connectionId }
    };

    try {
        await ddb.put(putParams).promise();
        if (notify) {
            await this.postOfferDeleteToAllConnections(apigwManagementApi, connectionId);
        }
    } catch (e) {
        console.log('deleteOffer: ' + JSON.stringify(e));
        // skipping this ex
    }
};

exports.delist = async (apigwManagementApi, connectionId, notify) => {
    try {
        await ddb.delete({ TableName: process.env.TABLE_NAME, Key: { connectionId } }).promise();
        if (notify) {
            await this.postOfferDeleteToAllConnections(apigwManagementApi, connectionId);
        }
    } catch (e) {
        console.log('delist: ' + JSON.stringify(e));
        // skipping this ex
    }
};
