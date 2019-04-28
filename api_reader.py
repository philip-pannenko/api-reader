import pprint
import requests


keywords = ["@date", "@all"]

def read_api(url, date_time_range, measures):
    """
    reads in an api from a url
    returns the values of the measures
    :param url: an API url with the necessary url parameters included
    :param date_time_range: The date and time range that is to be cared about
    :param measures: the values we care about from the json object
    :return: a json object containing the url, measures and their values only
    """

    response = requests.get(url)
    data = response.json()

    values = {}

    for measure in measures:
        nav = measure.split('.')
        data_piece = data

        for step in range(0, len(nav)):
            if step == len(nav) - 1:
                # found the value we're looking for
                values[measure] = data_piece

            elif nav[step][:4] == "@date":
                # find the value that has the date time overlap provided
                # find_relevant(date_time_range, nav[step+1], data_piece) # TODO
                values[measure] = data_piece[nav[step+1]] # temp, just return the bucket of data
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


def find_relevant(date_time_range, keyword, values):
    pass


url = "https://api.weather.gov/gridpoints/OKX/93,72"
measures = [
    "properties.temperature.values.@date=validTime.value",
    "properties.dewpoint.values.@date=validTime.value",
    "properties.apparentTemperature.values.@date=validTime.value",
    "properties.probabilityOfPrecipitation.values.@date=validTime.value"
    "properties.visibility.values.@date=validTime.value",
    "properties.lightningActivityLevel.values.@date=validTime.value"
            ]
# "properties.weather.values.@date=validTime.value.@all.weather", how to get?

date_time = "2019-05-01T06:00:00+00:00"


pprint.pprint(read_api(url, date_time, measures))