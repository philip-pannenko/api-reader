const AWS = require('aws-sdk/global');
const DynamoDB = require('aws-sdk/clients/dynamodb');

AWS.config.update({
    region: 'us-east-1',
    endpoint: 'http://localhost:8000'
});

const tableName = "uscogoDynamoDB";
const documentClient = new DynamoDB.DocumentClient();

let foo = async () => {

    try {

        let result = await documentClient.scan({TableName: tableName}).promise();
        console.log(JSON.stringify(result, null, 2));

    } catch (e) {
        console.error(e);
    }

};

foo();