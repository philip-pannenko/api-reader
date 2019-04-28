import requests
import arrow

keywords = ["@date", "@all"]

def read_api(url, date_time_range, measures):
    """
    reads in an api from a url
    returns the values of the measures
    :param url: an API url with the necessary url parameters included
    :param date_time_range: The date and time range that is to be cared about [start_date, end_date]
    :param measures: the values we care about from the json object
    :return: a json object containing the url, measures and their values only
    """

    response = requests.get(url)
    data = response.json()

    values = {}

    for measure in measures:
        nav = measure.split('.')
        data_piece = data

        # TODO get uom for values that have it and attach it to the values[measure] object

        for step in range(0, len(nav)):
            if step == len(nav) - 1:
                # found the value we're looking for
                values[measure] = data_piece

            elif nav[step][:4] == "@date":
                # find the value that has the date time overlap provided
                values[measure] = find_relevant(date_time_range, nav[step][4:], nav[step+1], data_piece)
                # values[measure] = data_piece[nav[step+1]] # temp, just return the bucket of data
                break

            elif nav[step] in keywords:
                # do something special for keywords
                if nav[step] == "@all":
                    # values[measure] = average(nav[step+1], data_piece)
                    values[measure] = data_piece[nav[step + 1]]
                    break

            elif nav[step] in data_piece:
                # drill down further
                data_piece = data_piece[nav[step]]

    return values


def average(keyword, values):
    """
    calculate average of all values at values[+].keyword and return
    :param keyword: the key of the value you care about
    :param values: [{key: value},...] array of dicts, values assumed numeric
    :return: single averaged value
    """
    average = 0.0
    for val in values:
        average += float(val[keyword])

    if len(values) > 0:
        average = average / len(values)

    return average


def find_relevant(date_time_range, date_keyword, val_keyword, values):
    """
    Returns a single value that encompasses the datetime range sent
    If multiple options in values fulfill this requirement, average and send back average
    :param date_time_range: [start_datetime, end_datetime]
    :param date_keyword: e.g. "validTime"
    :param val_keyword: e.g. "value"
    :param values: array of objects, e.g. [{'validTime': '2019-04-27T16:00:00+00:00/PT1H', 'value': 8}, ...]
    :return: a single value encompassing the date_time_range
    """
    result = ""

    valid_indicies = []
    for i in range(len(values)):
        time_range = values[i][date_keyword].split("/")

        start = arrow.get(range[0])
        span = 0
        if len(time_range) > 1:
            span = int(time_range[1][2:-1]) # e.g. if it's PT1H, span = 1
        end = start.shift(hours=span)

        if start <= date_time_range[0] and end >= date_time_range[1]:
            valid_indicies.append(i)

    if len(valid_indicies) > 1:
        result = average(val_keyword, values[valid_indicies])
    elif len(valid_indicies) == 1:
        result = values[valid_indicies[0]][val_keyword]

    return result


