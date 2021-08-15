const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

exports.onConnect = async event => {

    const connectionId = event.requestContext.connectionId;

    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    const putParams = {
        TableName: process.env.TABLE_NAME,
        Item: { connectionId }
    };

    try {
        await ddb.put(putParams).promise();
    } catch (err) {
        return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }

    try {
        const paiload = { connectionId };
        await apigwManagementApi.postToConnection({
            ConnectionId: event.requestContext.connectionId,
            Data: JSON.stringify(paiload) }).promise();
    } catch (err) {
        return { statusCode: 500, body: 'Failed to notify user: ' + JSON.stringify(err) };
    }

    // All log statements are written to CloudWatch
    console.info('connectionId', event.requestContext.connectionId);

    return { statusCode: 200, body: 'Connected.' };
};