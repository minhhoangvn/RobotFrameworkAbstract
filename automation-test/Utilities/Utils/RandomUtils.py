__author__ = 'hminh'
import random


class RandomHelper(object):
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'
    __instance = None

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = object.__new__(cls)
        return cls.__instance

    def get_random_item_list(self, list_item):
        self.__check_condition_get_random_list(list_item)
        return random.choice(list_item)

    def get_random_string(self, string_length, base_string=None, upper_flag=None):
        random_string = ""
        string_length = self.__convert_string_length(string_length)
        self.__check_valid_random_string_length(string_length)
        random_string = self.__init_random_string_with_base_string(random_string, base_string)
        random_string = self.__create_random_string(random_string, string_length)
        random_string = self.__convert_to_upper_string(random_string, upper_flag)
        return random_string

    # region Private Method Random List

    def __check_condition_get_random_list(self, list_item):
        if list_item is None:
            raise ValueError("List Item can not be NoneType")
        if len(list_item) == 0:
            raise ValueError('Can not get random item with empty list')
        if type(list_item) is not list:
            raise ValueError('Input is not type of List')

    # endregion

    # region Private Method Random String

    def __convert_string_length(self, string_length):
        try:
            string_length = int(string_length)
            return string_length
        except (ValueError, TypeError) as e:
            raise ValueError("Checking for string length parameter, it should be integer")

    def __check_valid_random_string_length(self, string_length):
        if (string_length > 0) is False:
            raise ValueError("String length should be greater than 0")

    def __init_random_string_with_base_string(self, random_string, base_string):
        if base_string is not None:
            random_string = base_string + random_string
        return random_string

    def __create_random_string(self, random_string, string_length):
        count_random_string_length = 0
        while count_random_string_length < int(string_length):
            random_string += random.choice('qwertyuiopasdfghjklzxcvbnm1234567890')
            count_random_string_length += 1
        return random_string

    def __convert_to_upper_string(self, random_string, upper_flag):
        if upper_flag is not None:
            random_string = random_string.upper()
        return random_string

    # endregion

    '''
    End
    '''
