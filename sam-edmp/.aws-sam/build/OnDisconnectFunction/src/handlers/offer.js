const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const { TABLE_NAME } = process.env;
const OFFER_METHOD_PUBLISH = "publishoffer";
const OFFER_METHOD_GET = "getoffers";
const OFFER_METHOD_REMOVE = "removeoffer";

exports.offer = async event => {
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    // get current connections for further operations:

    try {
        // switch method being called
        switch (event.requestContext.data.method) {
            case OFFER_METHOD_PUBLISH:
                // 1. store new/updated offer data
                const partyOffer = publishOffer(event.requestContext.connectionId, event.requestContext.data.payload);
                // 2. broadcast this offer to all connected users
                postOfferToAllConnections(apigwManagementApi, partyOffer);
                return { statusCode: 200, body: { connectionid: event.requestContext.connectionId }};
            case OFFER_METHOD_GET:
                postAllOffersToConnection(apigwManagementApi, event.requestContext.connectionId);
                return { statusCode: 200, body: {}};
            case OFFER_METHOD_REMOVE:
                deleteOffer(apigwManagementApi, event.requestContext.connectionId, true); // notify all users
                return { statusCode: 200, body: {}};
            default:
                return { statusCode: 500, body: event.requestContext.data.method + ' method not supported' };
        }
    } catch (error) {
        return { statusCode: 500, body: event.requestContext.data.method + ' failed: ' + JSON.stringify(err) };
    }
};

/** utilities */

function getCurrentConnectionIds() {
    try {
        return await ddb.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
    } catch (e) {
        throw e;
    }
}

function broadcastPostCalls(postCalls) {
    try {
        await Promise.all(postCalls);
    } catch (e) {
        throw e;
    }
}

/** method handlers*/

function postAllOffersToConnection(apigwManagementApi, connectionId) {
    // 1. get all stored offers
    // 2. for each:
    // 2.1. check if connection stale
    // 2.2. if stale - drop offer
    // 2.3. if ok - post an offer to the requestor (message per offer)

    let connections = await ddb.scan({ TableName: TABLE_NAME }).promise();
    broadcastPostCalls(connections.Items.filter(c => !!c.offer).map(async (partyOffer) => {
        postOfferToConnection(apigwManagementApi, connectionId, partyOffer);
    }));
}

function postOfferToConnection(apigwManagementApi, connectionId, partyOffer) {
    try {
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: partyOffer }).promise();
    } catch (e) {
        if (e.statusCode === 410) {
            console.log(`Found stale connection, deleting ${connectionId}`);
            deleteOffer(apigwManagementApi, connectionId, false); // won't notify other users to avoid spamming and recursion
        } else {
            throw e;
        }
    }
}

function postOfferToAllConnections(apigwManagementApi, partyOffer) {
    let connections = getCurrentConnectionIds();
    broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        postOfferToConnection(apigwManagementApi, connectionId, partyOffer);
    }));
}

function postOfferDeleteToAllConnections(apigwManagementApi, deletedConnectionId) {
    // only stale connection id can be broadcasted in this case
    let connections = getCurrentConnectionIds();
    broadcastPostCalls(connections.Items.map(async ({ connectionId }) => {
        const paiload = { dropoffer: deletedConnectionId };
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: paiload }).promise();
    }));
}

function deleteOffer(apigwManagementApi, connectionId, notify) {
    try {
        await ddb.delete({ TableName: TABLE_NAME, Key: { connectionId } }).promise();
        if (notify) {
            postOfferDeleteToAllConnections(apigwManagementApi, connectionId);
        }
    } catch (e) {
    }
}

function publishOffer(connectionId, offerData) {
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
        throw e;
    }

    return partyOffer;
}
