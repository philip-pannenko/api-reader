const AWS = require('aws-sdk/global');
const DynamoDB = require('aws-sdk/clients/dynamodb');
const {Data} = require('./data');

AWS.config.update({
    region: 'us-east-1',
    endpoint: 'http://localhost:8000'
});

const tableName = "uscogoDynamoDB";
const dynamoDB = new DynamoDB();
const documentClient = new DynamoDB.DocumentClient();

let foo = async () => {

    try {
        await dynamoDB.deleteTable({TableName: tableName}).promise();
    } catch (e) {
        console.error(e);
    }

    try {
        let result = await dynamoDB.createTable({
            TableName: tableName,
            KeySchema: [
                {AttributeName: "id", KeyType: "HASH"},
                {AttributeName: "sort", KeyType: "RANGE"},
            ],
            AttributeDefinitions: [
                {AttributeName: "id", AttributeType: "S"},
                {AttributeName: "sort", AttributeType: "S"},
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }).promise();

        for (let data of Data) {
            await documentClient.put({TableName: tableName, Item: data}).promise()
        }

        result = await documentClient.scan({TableName: tableName}).promise();
        console.log(JSON.stringify(result, null, 2));

    } catch (e) {
        console.error(e);
    }

};

foo();