const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

const {Engine, Rule} = require('json-rules-engine');
const fetch = require('node-fetch');

// TODO: Replace this dependency with the 'get' one that 'json-rules-engine comes with called, 'selectn'
const get = require('lodash.get');

// TODO: Get rid of this dependency
const moment = require('moment');

const {Rules, Measures} = require('./data');

// Declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

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
                        let parsedTime = moment(time[0]);

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
                        for (let i = 0; i < period; i++) {
                            let formattedTime = parsedTime.format();
                            if (results[formattedTime] === undefined) results[formattedTime] = {};
                            results[formattedTime][measure.category] = Math.round(timeValuePair.value);
                            parsedTime.add(1, 'hours'); // only relevent when period != 1
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

                    return {date: date, status: 'OK', reason: result};
                }
            }).catch(err => {
                console.error(err);
                // throw err;
            });
    });

};

// TODO: Experiment with error cases. Does the app fail gracefully?
app.get('/conditions', function (req, res) {

    // Get the data from weather api
    // TODO: Extract this arguments from the logged in user.
    getData('OKX', 93, 72, Measures)
        .then(facts => {

            // Run the rule engine against the API results
            Promise.all(runRulesEngine(facts, Rules))
                .then(result => {

                    // After all facts are checked against the rules, return the results
                    // TODO: Come up with a better uniform response package format
                    res.json({status: 'success', payload: result.filter(element => element !== undefined)});

                });
        });
});

app.listen(3001, function () {
    console.log("App started on port 3001")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
