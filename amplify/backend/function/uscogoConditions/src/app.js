const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const AWS = require('aws-sdk/global');

const DynamoDB = require('aws-sdk/clients/dynamodb');
const fetch = require('node-fetch');
const {Engine, Rule} = require('json-rules-engine');

// TODO: Replace this dependency with the 'get' one that 'json-rules-engine comes with called, 'selectn'
const get = require('lodash.get');

const moment = require('moment');
const parser = require('cron-parser');

// Static Coded Values
const {Measures} = require('./data');

// Declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());


AWS.config.update({
    region: 'us-east-1',
    endpoint: 'http://localhost:8000'
});

const documentClient = new DynamoDB.DocumentClient();
const table = "uscogoDynamoDB";

// Enable CORS for all methods
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next()
});

const getData = (station, lat, long, measures) => {
    let results = {};

    // This functionality is specific to the api.weather.gov data structure
    return fetch(`https://api.weather.gov/gridpoints/${station}/${lat},${long}`)
        .then(res => res.json())
        .then(json => {

            // Go through each of the desired measurements
            measures.forEach(measure => {

                // Get each measurement from the payload
                // TODO: Review variable naming
                let timeValuePairs = get(json, measure.code);
                if (timeValuePairs && timeValuePairs.length) {

                    // Go through each timestamp available for the payload associated with a measurement
                    timeValuePairs.forEach(timeValuePair => {

                        // Split '2019-05-01T15:00:00+00:00/PT1H' into a parsable date
                        let time = timeValuePair.validTime.split('/P');
                        let parsedTime = new Date(time[0]);

                        // Quantify the period (in hours) value found right of the '/' in '2019-05-01T15:00:00+00:00/PT1H'
                        // Value could be any of the following formats: PT1H, PT15H, P1D, P1DT15H
                        let period = 0;
                        if (time[1].includes('T')) {
                            period += parseInt(time[1].split('T')[1]);
                        }
                        if (time[1].includes('D')) {
                            period += parseInt(time[1].split('D')[0]) * 24;
                        }

                        // Stuff the value into a data structure for simple rule processing
                        // Loop over the period value to 'explode' the measure for the desired time period
                        for (let i = 0; i < period; i++) {
                            let formattedTime = parsedTime.toString();
                            if (results[formattedTime] === undefined) results[formattedTime] = {};
                            results[formattedTime][measure.category] = Math.round(timeValuePair.value);

                            parsedTime.setHours(parsedTime.getHours() + 1);
                            // parsedTime.add(1, 'hours'); // only relevent when period != 1
                        }

                    });
                }
            });
            return results;
        });
};

const runRulesEngine = (facts, rules) => {

    // Create a rule and gather results
    let rule = new Rule({
        conditions: {
            all: rules
        }, event: {
            type: 'success'
        },
    });

    // Create rules engine
    let engine = new Engine([rule], {
        allowUndefinedFacts: true
    });

    // Go through each fact and run against a set or rules which returns a list of promises
    return Object.keys(facts).map(date => {

        // Execute the rules engine against each timedate/property[] fact and accumulate the results
        let fact = facts[date];
        return engine
            .run(fact)
            .then(events => {

                // Only if the rule executed correctly for the timedate/property entity, do we add it to the response payload
                if (events.length && events[0].type === 'success') {

                    // We don't need this new property. We're removing it since it messes up the 'map' method next
                    delete fact['success-events'];

                    // Get a print friendly result for the conditions that passed
                    // TODO: Provide a unit / unit conversion
                    // TODO: Review variable naming
                    let result = Object.keys(fact).map(property => {
                        let measure = Measures.find((prop) => prop.category === property);
                        return {display: measure.display, value: fact[property]};
                    });

                    return {date: date, isEventOn: true, reason: result};
                } else {
                    return {date: date, isEventOn: false, reason: []};
                }
            }).catch(err => {
                console.error(err);
                // throw err;
            });
    });

};

app.get('/groups', function (req, res) {

    // Get all groups

    res.json({status: 'success'});
});

app.get('/groups/:groupId', function (req, res) {

    const id = req.params.groupId;
    const sort = "Details";

    const params = {
        TableName: table,
        Key: {
            "id": id,
            "sort": sort
        }
    };

    documentClient.get(params, function (err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            res.json({status: 'error', error: err, payload: data});

        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            res.json({status: 'success', payload: data});

        }
    });

});


const getGroup = async (groupId) => {

    let getGroupParams = {
        TableName: table,
        Key: {"id": groupId, "sort": "Details"}
    };
    let group = await documentClient.get(getGroupParams).promise();
    return group.Item;
};

const getGroupInstances = async (groupId) => {

    // TODO: make this query do a SORT key search for a time period
    let params = {
        TableName: table,
        KeyConditionExpression: 'id = :groupId',
        ExpressionAttributeValues: {':groupId': groupId}
    };
    let instances = await documentClient.query(params).promise();

    // TODO: I'm bad at reading documentation so I'm manually removing something that I think I should be able to sort by
    instances = instances.Items.filter(item => item.sort !== "Details");

    // TODO: Did I mention I'm bad at documention? I'm manually sorting on client <sigh>
    instances.sort(function (a, b) {
        return a.sort - b.sort;
    });

    return instances
};

const isRefreshPeriodValid = async (lastRefreshed) => {
    let oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return oneHourAgo.getTime() > new Date(lastRefreshed).getTime();
};

const getGroupMeasures = (rules) => {
    // TODO: extract the needed measures from the group rules
    return Measures;
};

const processData = async (weatherData, rules, futureInstances) => {
    let results = await Promise.all(runRulesEngine(weatherData, rules));
    results = results.filter(element =>
        element !== undefined &&
        futureInstances.find(futureInstance => futureInstance.sort === element.date) !== undefined);
    return results;
};

const getFutureInstances = (groupId, periodicity) => {

    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    let futureInstances = [];
    let options = {
        currentDate: new Date().toString(),
        endDate: endDate.toString(),
        iterator: true
    };
    periodicity.forEach(cron => {
        let interval = parser.parseExpression(cron, options);
        let obj = {done: false};
        while (!obj.done) {
            obj = interval.next();
            futureInstances.push(
                {
                    id: groupId,
                    sort: obj.value.toDate().toString(),
                    type: "Group Event Instance"
                });
        }

    });
    futureInstances.sort(function (a, b) {
        return a.sort - b.sort;
    });

    return futureInstances;
};

const addFutureInstances = async (futureInstances, instances) => {

    let newInstances = futureInstances.filter(futureInstance =>
        instances.find(instance => instance.sort === futureInstance.sort) === undefined
    );

    if (newInstances.length) {

        // Add the new instances to the DB.
        let putRequests = newInstances.map(newInstance => ({PutRequest: {Item: newInstance}}));
        let params = {RequestItems: {[table]: putRequests}};
        await documentClient.batchWrite(params).promise();
    }

    return newInstances;

};

const updateInstancesWithConditions = async (instances, processedData) => {

    for (let data of processedData) {

        let instance = instances.find(instance => {
            return instance.sort === data.date;
        });

        if (instance) {

            let params = {
                TableName: table,
                Key: {id: instance.id, sort: instance.sort},
                UpdateExpression: "set reasons = :reasons, isEventOn= :isEventOn",
                ExpressionAttributeValues: {
                    ":reasons": data.reason,
                    ":isEventOn": data.isEventOn
                }
            };

            await documentClient.update(params).promise();

        } else {
            console.error("We shouldn't have gotten a processed data for an entry outside of available event instances! ", data);
        }
    }
};

app.post('/groups/:groupId/refresh', async (req, res) => {

    try {

        // Get the Group from the DB
        let group = await getGroup(req.params.groupId);

        // Determine if a refresh is within a valid time period
        if (!isRefreshPeriodValid(group.lastRefreshed)) {
            res.json({status: 'error', error: "Not refreshing, updated very recently"});
            return;
        }

        // Get the measurements requested by the groups rules
        let measures = getGroupMeasures(group.rules);

        // Gather external data using the Groups measurement needs
        let weatherData = await getData('OKX', 93, 72, measures);

        // Generate upcoming event instances
        let futureInstances = getFutureInstances(group.id, group.periodicity);

        // Get all of the instances for the group
        let instances = await getGroupInstances(group.id);

        // Persist any new future instances that don't yet exist in the DB
        instances = instances.concat(await addFutureInstances(futureInstances, instances));

        // Run the group rules against the weather data and filter by valid periodicity
        let processedData = await processData(weatherData, group.rules, instances);

        // Update existing instances with recent weather conditions
        await updateInstancesWithConditions(instances, processedData);

        res.json({
            status: 'success',
            payload: {group: group, instances: instances}
        });

    } catch (e) {
        console.error(e);
        res.json({status: 'error', error: e});

    }

});

app.listen(3001, function () {
    console.log("App started on port 3001")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
