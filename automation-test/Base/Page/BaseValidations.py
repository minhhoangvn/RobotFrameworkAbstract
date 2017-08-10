__author__ = 'hminh'
from Base.Core.BaseObject import BaseObjectPage
from robot.libraries.Collections import Collections
from robot.libraries.BuiltIn import BuiltIn
from robot.libraries.String import String


class BaseValidationsPage(BaseObjectPage, Collections, BuiltIn, String):
    def __init__(self):
        super(BaseValidationsPage, self).__init__()

    def list_actual_result_should_not_contains(self, contain_value, error_handler, **list_actual_result):
        message_log = ""
        error_log = ""
        log_format = " [{} is: {}] "
        error_format = "[{} is: FAILED]"
        verify_flag = True
        for item in list_actual_result:
            result = "PASSED" if str(list_actual_result[item]) != str(contain_value) else "FAILED"
            message_log += log_format.format(item, result)
            if str(list_actual_result[item]) == str(contain_value):
                verify_flag = False
                error_log += error_format.format(item)
        self.robot_built_in.log(
            '<p style=" font-size: 14px; font-weight: 900; font-family: cursive; ">' + message_log + '</p>',
            html=True, level='INFO')
        try:
            self.robot_built_in.should_be_true(verify_flag, error_log)
        except AssertionError as e:
            self.robot_built_in.log(str(e),
                                    html=True, level='ERROR')
            self.robot_built_in.set_test_variable("${TEST_RESULTS}", False)
            if error_handler is False:
                raise e

    def should_contain(self, container, item, msg=None, values=True, ignore_case=False):
        return super(BaseValidationsPage, self).should_contain(container, item, msg, values, ignore_case)

    def should_contain_x_times(self, item1, item2, count, msg=None, ignore_case=False):
        super(BaseValidationsPage, self).should_contain_x_times(item1, item2, count, msg, ignore_case)

    def should_end_with(self, str1, str2, msg=None, values=True, ignore_case=False):
        return super(BaseValidationsPage, self).should_end_with(str1, str2, msg, values, ignore_case)

    def should_be_unicode_string(self, item, msg=None):
        super(BaseValidationsPage, self).should_be_unicode_string(item, msg)

    def should_not_be_string(self, item, msg=None):
        super(BaseValidationsPage, self).should_not_be_string(item, msg)

    def should_contain_match(self, list, pattern, msg=None, case_insensitive=False, whitespace_insensitive=False):
        super(BaseValidationsPage, self).should_contain_match(list, pattern, msg, case_insensitive,
                                                              whitespace_insensitive)

    def should_be_equal_as_numbers(self, first, second, msg=None, values=True, precision=6):
        super(BaseValidationsPage, self).should_be_equal_as_numbers(first, second, msg, values, precision)

    def should_not_contain(self, container, item, msg=None, values=True, ignore_case=False):
        return super(BaseValidationsPage, self).should_not_contain(container, item, msg, values, ignore_case)

    def should_not_be_equal_as_strings(self, first, second, msg=None, values=True, ignore_case=False):
        super(BaseValidationsPage, self).should_not_be_equal_as_strings(first, second, msg, values, ignore_case)

    def should_be_equal_as_strings(self, first, second, msg=None, values=True, ignore_case=False):
        super(BaseValidationsPage, self).should_be_equal_as_strings(first, second, msg, values, ignore_case)

    def should_be_equal(self, first, second, msg=None, values=True, ignore_case=False):
        super(BaseValidationsPage, self).should_be_equal(first, second, msg, values, ignore_case)

    def should_not_be_empty(self, item, msg=None):
        return super(BaseValidationsPage, self).should_not_be_empty(item, msg)

    def should_start_with(self, str1, str2, msg=None, values=True, ignore_case=False):
        return super(BaseValidationsPage, self).should_start_with(str1, str2, msg, values, ignore_case)

    def should_not_be_equal_as_numbers(self, first, second, msg=None, values=True, precision=6):
        super(BaseValidationsPage, self).should_not_be_equal_as_numbers(first, second, msg, values, precision)

    def list_should_contain_sub_list(self, list1, list2, msg=None, values=True):
        super(BaseValidationsPage, self).list_should_contain_sub_list(list1, list2, msg, values)

    def should_be_byte_string(self, item, msg=None):
        super(BaseValidationsPage, self).should_be_byte_string(item, msg)

    def should_be_string(self, item, msg=None):
        super(BaseValidationsPage, self).should_be_string(item, msg)

    def list_should_contain_value(self, list_, value, msg=None):
        super(BaseValidationsPage, self).list_should_contain_value(list_, value, msg)

    def should_contain_any(self, container, *items, **configuration):
        return super(BaseValidationsPage, self).should_contain_any(container, *items, **configuration)

    def should_not_be_true(self, condition, msg=None):
        return super(BaseValidationsPage, self).should_not_be_true(condition, msg)

    def should_not_be_equal_as_integers(self, first, second, msg=None, values=True, base=None):
        super(BaseValidationsPage, self).should_not_be_equal_as_integers(first, second, msg, values, base)

    def should_not_match_regexp(self, string, pattern, msg=None, values=True):
        return super(BaseValidationsPage, self).should_not_match_regexp(string, pattern, msg, values)

    def should_match(self, string, pattern, msg=None, values=True, ignore_case=False):
        return super(BaseValidationsPage, self).should_match(string, pattern, msg, values, ignore_case)

    def should_not_contain_any(self, container, *items, **configuration):
        return super(BaseValidationsPage, self).should_not_contain_any(container, *items, **configuration)

    def should_be_equal_as_integers(self, first, second, msg=None, values=True, base=None):
        super(BaseValidationsPage, self).should_be_equal_as_integers(first, second, msg, values, base)

    def list_should_not_contain_value(self, list_, value, msg=None):
        super(BaseValidationsPage, self).list_should_not_contain_value(list_, value, msg)

    def should_not_contain_match(self, list, pattern, msg=None, case_insensitive=False, whitespace_insensitive=False):
        super(BaseValidationsPage, self).should_not_contain_match(list, pattern, msg, case_insensitive,
                                                                  whitespace_insensitive)

    def list_should_not_contain_duplicates(self, list_, msg=None):
        return super(BaseValidationsPage, self).list_should_not_contain_duplicates(list_, msg)

    def dictionary_should_contain_sub_dictionary(self, dict1, dict2, msg=None, values=True):
        super(BaseValidationsPage, self).dictionary_should_contain_sub_dictionary(dict1, dict2, msg, values)

    def should_be_lowercase(self, string, msg=None):
        super(BaseValidationsPage, self).should_be_lowercase(string, msg)

    def should_be_uppercase(self, string, msg=None):
        super(BaseValidationsPage, self).should_be_uppercase(string, msg)

    def dictionaries_should_be_equal(self, dict1, dict2, msg=None, values=True):
        super(BaseValidationsPage, self).dictionaries_should_be_equal(dict1, dict2, msg, values)

    def dictionary_should_contain_item(self, dictionary, key, value, msg=None):
        super(BaseValidationsPage, self).dictionary_should_contain_item(dictionary, key, value, msg)

    def lists_should_be_equal(self, list1, list2, msg=None, values=True, names=None):
        super(BaseValidationsPage, self).lists_should_be_equal(list1, list2, msg, values, names)

    def should_be_empty(self, item, msg=None):
        return super(BaseValidationsPage, self).should_be_empty(item, msg)

    def should_match_regexp(self, string, pattern, msg=None, values=True):
        return super(BaseValidationsPage, self).should_match_regexp(string, pattern, msg, values)

    def should_not_be_equal(self, first, second, msg=None, values=True, ignore_case=False):
        super(BaseValidationsPage, self).should_not_be_equal(first, second, msg, values, ignore_case)

    def should_not_match(self, string, pattern, msg=None, values=True, ignore_case=False):
        return super(BaseValidationsPage, self).should_not_match(string, pattern, msg, values, ignore_case)

    def should_be_titlecase(self, string, msg=None):
        super(BaseValidationsPage, self).should_be_titlecase(string, msg)
