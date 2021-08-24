const AWS = require('aws-sdk');
const shared = require('../shared/shared.js');

exports.onDisconnect = async event => {

    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    try {
        await shared.offline(apigwManagementApi, event.requestContext.connectionId, true)
    } catch (err) {
        return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
    }

    return { statusCode: 200, body: 'Disconnected.' };
};