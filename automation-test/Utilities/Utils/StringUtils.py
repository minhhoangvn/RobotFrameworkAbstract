__author__ = 'hminh'
import re


class StringHelper(object):
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'
    __instance = None

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = object.__new__(cls)
        return cls.__instance

    def find_string_by_regex(self, pattern, source_string):
        regex = self.__compile_pattern(pattern)
        return regex.findall(source_string)

    def check_contains_string_by_regex(self, pattern, source_string):
        regex = self.__compile_pattern(pattern)
        is_contains_string = regex.search(source_string) is not None
        return is_contains_string

    def replace_string_by_regex(self, pattern, replace_value, source_string):
        regex = self.__compile_pattern(pattern)
        return regex.sub(str(replace_value), source_string)

    # region private method

    def __compile_pattern(self, pattern):
        try:
            regex = re.compile(pattern)
            return regex
        except re.error:
            ValueError("Pattern [" + pattern + "] is not valid regular expression")

    # endregion

    '''
    '''
