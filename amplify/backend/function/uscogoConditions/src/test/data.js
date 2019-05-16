const uuidv4 = require('uuid/v4');

let user1 = {
    id: uuidv4(),
    sort: "Details",
    type: "User Details",
    name: "Philip",
    email: "philip.pannenko@gmail.com",
    version: 1
};

let user2 = {
    id: uuidv4(),
    sort: "Details",
    type: "User Details",
    name: "Liz",
    email: "another.liz.wong@gmail.com",
    version: 1
};

let user3 = {
    id: uuidv4(),
    sort: "Details",
    type: "User Details",
    name: "Amanda",
    email: "amanda.pannenko@gmail.com",
    version: 1
};

/*
* * * * *
| | | | |
| | | | +---- Day of the Week   (range: 0-6, 1 standing for Monday)
| | | +------ Month of the Year (range: 1-12)
| | +-------- Day of the Month  (range: 1-31)
| +---------- Hour              (range: 0-23)
+------------ Minute            (range: 0-59)
 */
let group1 = {
    id: "f1c26ec6-459d-4ecf-bc02-52b12c565915", // uuidv4(),
    sort: "Details",
    type: "Group Details",
    name: "Group Name 1",
    description: "Group Description 1",
    lastRefreshed: '2019-05-09T06:00:00',
    periodicity: [
        "0 6 * * MON,TUE,FRI",
        "0 7 * * THU,FRI"
    ],
    members: [
        user1.id,
        user2.id,
        user3.id
    ],
    rules: [
        {
            fact: 'airTemp',
            operator: 'greaterThanInclusive',
            value: 10
        }, {
            operator: 'greaterThanInclusive',
            fact: 'feelsLike',
            value: 12
        }, {
            fact: 'rainChance',
            operator: 'lessThan',
            value: 40
        }, {
            fact: 'dewTemp',
            operator: 'lessThan',
            value: {
                fact: 'airTemp',
            }
        }, {
            fact: 'visibility',
            operator: 'greaterThan',
            value: 10
        }, {
            fact: 'lightningChance',
            operator: 'equal',
            value: 1
        }
    ],
    version: 1
};

//GROUP_ID | EVENT_DATE | VERSION | PARTICIPANTS[] | STEP_FUNCTION_CANCEL[]

//2019-05-01T15:00:00+00:00/PT1H
let group1Instance1 = {
    id: group1.id,
    sort: 'Thur May 9 2019 06:00:00 GMT-0400 (Eastern Daylight Time)',
    type: "Group Event Instance",
    isEventOn: true,
    participants: [
        user1.id,
        user2.id
    ],
    reasons: [
        {
            display: "Air Temp",
            value: 13
        },
        {
            display: "Dew Point",
            value: 12
        },
        {
            display: "Feels Like",
            value: 13
        },
        {
            display: "Rain %",
            value: 32
        },
        {
            display: "Visibility",
            value: 8047
        },
        {
            display: "Lightning %",
            value: 1
        }
    ]
};

let group1Instance2 = {
    id: group1.id,
    sort: 'Fri May 10 2019 06:00:00 GMT-0400 (Eastern Daylight Time)',
    type: "Group Event Instance",
    isEventOn: true,
    participants: [
        user1.id,
        user2.id
    ],
    reasons: [
        {
            display: "Air Temp",
            value: 12
        },
        {
            display: "Dew Point",
            value: 8
        },
        {
            display: "Feels Like",
            value: 12
        },
        {
            display: "Rain %",
            value: 6
        },
        {
            display: "Visibility",
            value: 14484
        },
        {
            display: "Lightning %",
            value: 1
        }
    ]
};

let group1Instance3 = {
    id: group1.id,
    sort: 'Mon May 06 2019 06:00:00 GMT-0400 (Eastern Daylight Time)',
    type: "Group Event Instance",
    isEventOn: true,
    participants: [],
    reasons: [
        {
            display: "Air Temp",
            value: 13
        },
        {
            display: "Dew Point",
            value: 7
        },
        {
            display: "Feels Like",
            value: 13
        },
        {
            display: "Rain %",
            value: 5
        },
        {
            display: "Visibility",
            value: 14484
        },
        {
            display: "Lightning %",
            value: 1
        }
    ]
};

exports.Data = [user1, user2, user3, group1, group1Instance1, group1Instance2, group1Instance3];


