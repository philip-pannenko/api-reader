exports.Measures = [
    {display: "Air Temp", category: 'airTemp', code: "properties.temperature.values", unit: 'C'},
    {display: "Dew Point", category: 'dewTemp', code: "properties.dewpoint.values", unit: 'C'},
    {display: "Feels Like", category: 'feelsLike', code: "properties.apparentTemperature.values", unit: 'C'},
    {display: "Rain %", category: 'rainChance', code: "properties.probabilityOfPrecipitation.values", unit: '%'},
    {display: "Visibility", category: 'visibility', code: "properties.visibility.values", unit: 'M'},
    {display: "Lightning %", category: 'lightningChance', code: "properties.lightningActivityLevel.values", unit: ''},
];

exports.TestFacts = {
    '2019-05-01T11:00:00-04:00': {
        "airTemp": 11,
        "feelsLike": 12,
        "rainChance": 0,
        "dewTemp": 40,
        "visibility": 20,
        "lightningChance": 0
    },
    '2019-05-01T11:01:00-04:00': {
        "airTemp": 23,
        "feelsLike": 24,
        "rainChance": 0,
        "dewTemp": 40,
        "visibility": 20,
        "lightningChance": 0
    },
    '2019-05-01T11:02:00-04:00': {
        "airTemp": 25,
        "feelsLike": 26,
        "rainChance": 0,
        "dewTemp": 30,
        "visibility": 20,
        "lightningChance": 0
    }
};

// exports.Rules = [
//     {
//         fact: 'airTemp',
//         operator: 'greaterThanInclusive',
//         value: 10
//     }, {
//         fact: 'feelsLike',
//         operator: 'greaterThanInclusive',
//         value: 12
//     }, {
//         fact: 'rainChance',
//         operator: 'lessThan',
//         value: 40
//     }, {
//         fact: 'dewTemp',
//         operator: 'lessThan',
//         value: {
//             fact: 'airTemp',
//         }
//     }, {
//         fact: 'visibility',
//         operator: 'greaterThan',
//         value: 10
//     }, {
//         fact: 'lightningChance',
//         operator: 'equal',
//         value: 1
//     }
// ];

