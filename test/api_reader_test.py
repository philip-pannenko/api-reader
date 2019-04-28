import pprint
import api_reader

url = "https://api.weather.gov/gridpoints/OKX/93,72"
measures = [
    "properties.temperature.values.@date=validTime.value",
    "properties.dewpoint.values.@date=validTime.value",
    "properties.apparentTemperature.values.@date=validTime.value",
    "properties.probabilityOfPrecipitation.values.@date=validTime.value",
    "properties.visibility.values.@date=validTime.value",
    "properties.lightningActivityLevel.values.@date=validTime.value"
            ]
# "properties.weather.values.@date=validTime.value.@all.weather", how to get?

date_time = ["2019-05-01T06:00:00+00:00", "2019-05-01T07:00:00+00:00"]


pprint.pprint(api_reader.read_api(url, date_time, measures))