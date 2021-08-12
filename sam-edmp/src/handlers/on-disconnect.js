const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

exports.onDisconnect = async event => {
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    try {
        await deleteOffer(apigwManagementApi, event.requestContext.connectionId, true)
    } catch (err) {
        return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
    }

    return { statusCode: 200, body: 'Disconnected.' };
};

async function getCurrentConnectionIds() {
    try {
        return await ddb.scan({ TableName: process.env.TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
    } catch (e) {
        console.log('getCurrentConnectionIds: ' + JSON.stringify(e));
        throw e;
    }
}
async function broadcastPostCalls(postCalls) {
    try {
        await Promise.all(postCalls);
    } catch (e) {
        console.log('broadcastPostCalls: ' + JSON.stringify(e));
        throw e;
    }
}

async function postOfferDeleteToAllConnections(apigwManagementApi, deletedConnectionId) {
    // only stale connection id can be broadcasted in this case
    const connections = await getCurrentConnectionIds();
    await broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        const paiload = { dropoffer: deletedConnectionId };
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(paiload) }).promise();
    }));
}

async function deleteOffer(apigwManagementApi, connectionId, notify) {
    try {
        await ddb.delete({ TableName: process.env.TABLE_NAME, Key: { connectionId } }).promise();
        if (notify) {
            await postOfferDeleteToAllConnections(apigwManagementApi, connectionId);
        }
    } catch (e) {
        console.log('deleteOffer: ' + JSON.stringify(e));
        // skipping this ex
    }
}