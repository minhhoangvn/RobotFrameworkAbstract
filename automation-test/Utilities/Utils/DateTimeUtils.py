__author__ = 'hminh'

from datetime import datetime, timedelta
from time import time


class DateTimeHelper(object):
    ROBOT_LIBRARY_SCOPE = 'TEST SUITE'
    __instance = None

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = object.__new__(cls)
        return cls.__instance

    @property
    def get_time_stamp(self):
        return int(time())

    @property
    def get_time_stamp_in_string_value(self):
        year = str(datetime.now().year)
        month_value = str(datetime.now().month)
        date_value = str(datetime.now().day)
        hour_value = str(datetime.now().hour)
        minutes_value = str(datetime.now().minute)
        month = "0" + month_value if len(month_value) == 1 else month_value
        date = "0" + date_value if len(date_value) == 1 else date_value
        hour = "0" + hour_value if len(hour_value) == 1 else hour_value
        minutes = "0" + str(minutes_value) if len(minutes_value) == 1 else minutes_value
        microsecond = str(datetime.now().microsecond)[0:4]
        return year + '_' + month + '_' + date + '_' + hour + '_' + minutes + '_' + microsecond

    @property
    def get_date_time_string_value(self):
        return str(datetime.now().ctime())

    @staticmethod
    def convert_milliseconds_to_hours_min_seconds(milliseconds):
        millis = int(milliseconds)
        seconds = (millis / 1000) % 60
        seconds = str(seconds) if len(str(seconds)) > 1 else '0' + str(seconds)
        minutes = (millis / (1000 * 60)) % 60
        minutes = str(minutes) if len(str(minutes)) > 1 else '0' + str(minutes)
        hours = (millis / (1000 * 60 * 60)) % 24
        hours = str(hours) if len(str(hours)) > 1 else '0' + str(hours)
        return "%s:%s:%s" % (hours, minutes, seconds)

    def calculate_time_by_current_date(self, added_value):
        return datetime.now() + timedelta(added_value)
