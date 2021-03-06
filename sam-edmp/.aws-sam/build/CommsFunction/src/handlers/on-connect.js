const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });
const utils = require('../shared/utils.js');


exports.onConnect = async event => {
    const putParams = {
        TableName: process.env.CONN_TABLE_NAME,
        Item: {
            connectionId: event.requestContext.connectionId,
            token: utils.uuidv4()
        }
    };

    try {
        await ddb.put(putParams).promise();
    } catch (err) {
        return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }
    // All log statements are written to CloudWatch
    console.info('connectionId', event.requestContext.connectionId);

    return { statusCode: 200, body: 'Connected.' };
};