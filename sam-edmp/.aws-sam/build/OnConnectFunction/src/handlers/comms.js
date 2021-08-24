const AWS = require('aws-sdk');
const shared = require('../shared/shared.js');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const {
    CONN_TABLE_NAME,
    TRACE_TABLE_NAME,
    OFFER_TABLE_NAME } = process.env;

const COMMS_METHOD_BIDPUSH = "bidpush";
const COMMS_METHOD_BIDPULL = "bidpull";
const COMMS_METHOD_BIDACCEPT = "bidaccept";
const COMMS_METHOD_MESSAGE = "message";

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
            case COMMS_METHOD_BIDPUSH:
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case COMMS_METHOD_BIDPULL:
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case COMMS_METHOD_BIDACCEPT:
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            case COMMS_METHOD_MESSAGE:
                return { statusCode: 200, body: JSON.stringify({ connectionid })};
            default:
                return { statusCode: 500, body: eventBody.data.method + ' method not supported' };
        }
    } catch (e) {
        console.log('failed request body: ' + event.body + ' stack: ' + JSON.stringify(e));
        return { statusCode: 500, body: 'failed request body: ' + event.body + ' : ' + JSON.stringify(e) };
    }
};
