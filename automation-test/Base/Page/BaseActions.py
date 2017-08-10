__author__ = 'hminh'
from selenium.common.exceptions import WebDriverException, StaleElementReferenceException
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import Select

from Base.Core.BaseObject import BaseObjectPage
from Utilities.Utils.DataBaseUtils import DataBaseHelper
from VMS.Commons.POM.Elements.BootstrapElements import BootstrapElementComponent


class ConvertActions(object):
    @staticmethod
    def convert_parameter_to_integer_type(value):
        try:
            return int(value)
        except ValueError:
            raise ValueError("Parameter value is not integer type")

    @staticmethod
    def get_difference_value_in_2_set_data(set_a, set_b):
        difference_set_a = list(set(set_a) - set(set_b))
        difference_set_b = list(set(set_b) - set(set_a))
        return difference_set_a + difference_set_b


class LogAction(BaseObjectPage):
    def __init__(self):
        super(LogAction, self).__init__()

    __long_error_message = ""

    # region Log Method

    @staticmethod
    def set_long_error_message(message):
        LogAction.__long_error_message = message

    @staticmethod
    def get_long_error_message():
        error_message = LogAction.__long_error_message
        LogAction.__long_error_message = ""
        return error_message

    @staticmethod
    def log_debug_pycharm(message):
        print(message)

    def log_debug(self, message):
        message = self.date_time_helper.get_date_time_string_value + ": " + message
        self.robot_built_in.log_to_console(message)

    def log_info_xml(self, message):
        self.robot_built_in.log(message, html=False, level='DEBUG')
        self.log_debug(str(message))

    def log_info(self, message):
        self.robot_built_in.log(message, html=True, level='INFO')
        self.log_debug(str(message))

    def log_info_with_html_color_blue(self, message):
        message_template = '<p style="color: #100cce;font-size: 14px;font-weight: 800;">{0}</p>'
        message = message_template.format(message)
        self.robot_built_in.log(message, html=True, level='INFO')
        self.log_debug(str(message))

    def log_info_with_html_color_red(self, message):
        message_template = '<p style="color: #ff0330;font-size: 14px;font-weight: 800;">{0}</p>'
        message = message_template.format(message)
        self.robot_built_in.log(message, html=True, level='INFO')
        self.log_debug(str(message))

    def log_info_with_html_color_black(self, message):
        message_template = '<p style="font-size: 14px;font-weight: 800;">{0}</p>'
        message = message_template.format(message)
        self.robot_built_in.log(message, html=True, level='INFO')
        self.log_debug(str(message))

    def log_warn(self, message):
        self.robot_built_in.log(message, html=True, level='WARN')

    def log_error(self, message):
        message_template = '<p style="color: #ff0330;font-size: 14px;font-weight: 800;">{0}</p>'
        message = message_template.format(message)
        self.robot_built_in.log(message, html=True, level='ERROR')

    def capture_web_screen_shot(self, file_name):
        self.selenium.capture_page_screenshot(file_name)

        # endregion


class DataBaseAction(BaseObjectPage):
    def __init__(self):
        super(DataBaseAction, self).__init__()

    def get_db_instance(self):
        return DataBaseHelper(self.test_runner.database_name,
                              self.test_runner.database_port)

    def get_db_instance_with_sql_folder(self):
        return DataBaseHelper(self.test_runner.database_name,
                              self.test_runner.database_port,
                              sql_source_scripts_path=self.test_runner.database_sql_source_scripts_path)


class WebElementActions(LogAction):
    def __init__(self):
        super(WebElementActions, self).__init__()
        self.__bootstrap_elements = BootstrapElementComponent()

    def log_action_keyword(keyword):
        def keyword_wrapped(self, *args):
            if len(args) > 0:
                element_name = str(args[0]) if type(args[0]) is not WebElement else 'has location ' + str(
                    args[0].location_once_scrolled_into_view)
                self.log_info_xml(
                    "Action " + str(keyword.__name__) + " to web element " + element_name + " with options [" + str(
                        args[1:]) + "]")
            else:
                self.log_info_xml(
                    "Action " + str(keyword.__name__) + " with options [" + str(args) + "]")
            return keyword(self, *args)

        return keyword_wrapped

    # region Wrapped Method in Selenium Action of Selenium2Library

    # region Browser

    def open_web_browser(self, url="http://localhost", browser_type=None):
        browser = browser_type if browser_type is not None else self.test_runner.browser
        self.selenium.open_browser(url, browser)
        if self.test_runner.is_maximize_browser.upper() == 'TRUE':
            self.maximize_browser()
        if self.test_runner.is_hidden_browser.upper() == 'TRUE':
            self.hidden_browser()

    def navigate_browser_with_full_url(self, full_url):
        self.selenium.go_to(full_url)

    def maximize_browser(self):
        self.selenium.maximize_browser_window()

    def hidden_browser(self):
        self.selenium.set_window_position(-2000, 0)

    def navigate_browser_to(self, path_page, base_url=None):
        if base_url is None and len(self.test_runner.base_url) == 0:
            raise ValueError("Missing BaseURL value, edit runner-config.xml or add value to base_url parameter")
        url = base_url + "/" + path_page if base_url is not None else (
            self.test_runner.base_url + path_page if self.test_runner.base_url.endswith(
                "/") else self.test_runner.base_url + "/" + path_page)
        self.selenium.go_to(url)

    def get_current_url(self):
        return self.selenium.get_location()

    def close_current_browser(self):
        self.selenium.close_all_browsers()

    # endregion

    # region Action in Element

    @log_action_keyword
    def set_text_element(self, web_element, text):
        text = str(text)
        element = self.get_web_element(web_element)
        element.clear()
        element.send_keys(text)

    @log_action_keyword
    def click_element(self, web_element):
        try:
            element = self.get_web_element(web_element)
            element.click()
        except WebDriverException:
            self.log_info_with_html_color_red("Has error in using native event for click element, "
                                              "try to click element via JS")
            self.capture_web_screen_shot("Has_Click_Error_" + str(self.date_time_helper.get_time_stamp) + ".png")
            self.selenium.execute_javascript("window.scrollTo(0,0)")
            self.click_element_by_javascript(web_element)

    @log_action_keyword
    def click_element_by_javascript(self, web_element):
        element = self.get_web_element(web_element)
        self.web_driver.execute_script("arguments[0].scrollIntoView();arguments[0].click();", element)

    @log_action_keyword
    def get_element_text(self, web_element):
        try:
            element = self.get_web_element(web_element)
            element_text = element.text
        except StaleElementReferenceException:
            element = self.get_web_element(web_element)
            element_text = element.text
        return element_text

    @log_action_keyword
    def get_element_attribute_value(self, web_element, attribute_type):
        try:
            element = self.get_web_element(web_element)
            element_attribute_value = element.get_attribute(attribute_type)
        except StaleElementReferenceException:
            element = self.get_web_element(web_element)
            element_attribute_value = element.get_attribute(attribute_type)
        return element_attribute_value

    @log_action_keyword
    def select_options_dropdown(self, select_element, option, select_type):
        select_options = set(['label', 'index', 'value'])
        if select_type not in select_options:
            raise ValueError("Type in select options drop down should be ['label', 'index', 'value']")
        if type(select_element) == str:
            element = self.get_web_element(select_element)
        if element.tag_name != "select":
            raise ValueError('WebElement is not select tag')
        if select_type == 'label':
            self.selenium.select_from_list_by_label(element, option)
        elif select_type == 'index':
            if isinstance(option, int) is False:
                raise ValueError("Option value select by index is not integer type")
            self.selenium.select_from_list_by_index(element, option)
        elif select_type == 'value':
            self.selenium.select_from_list_by_value(element, option)

    @log_action_keyword
    def get_list_options_value(self, select_element):
        element = self.get_web_element(select_element)
        if element.tag_name != 'select':
            raise ValueError("WebElement is not Select Tag")
        select = Select(element)
        list_options = []
        options = select.options
        if len(options) > 0:
            for option in options:
                list_options.append(option.get_attribute("text"))
            return list_options
        else:
            raise ValueError("Element does not contains any options")

    @log_action_keyword
    def get_selected_option_text(self, select_element):
        element = self.get_web_element(select_element)
        if element.tag_name != 'select':
            raise ValueError("WebElement is not Select Tag")
        select = Select(element)
        options = select.options
        if len(options) > 0:
            return str(select.first_selected_option)
        else:
            raise ValueError("Element does not contains any options")

    @log_action_keyword
    def remove_element_in_dom(self, web_element):
        element = self.get_web_element(web_element)
        self.web_driver.execute_script("arguments[0].remove();", element)

    # endregion

    # region Action in Table Element

    @log_action_keyword
    def get_table_cell_value(self, table_element, row_index, column_index):
        row_index = self.convert_parameter_to_integer_type(row_index)
        column_index = self.convert_parameter_to_integer_type(column_index)
        cell_value = self.selenium.get_table_cell(table_element, row_index, column_index)
        return cell_value

    @log_action_keyword
    def get_list_rows_element_in_table(self, table_element):
        try:
            table_element = self.get_web_element(table_element) if type(table_element) is str else table_element
            list_row_elements = table_element.find_elements_by_tag_name('tr')
            return list_row_elements
        except ValueError:
            return []

    # endregion

    # region Explicit Wait Element

    @log_action_keyword
    def wait_for_finish_render(self, time_out="120s", ignore_time_out=False):
        self.log_info("Wait for page finished render GUI")
        try:
            self.wait_for_ajax_successfully(time_out)
            self.wait_for_loading_bar_invisible(time_out)
        except Exception as e:
            if ignore_time_out is True:
                self.log_info("Time out in wait for page finished render GUI, but user set ignore is True")
                return True
            raise e

    @log_action_keyword
    def wait_for_ajax_successfully(self, time_out="120s"):
        self.wait_for_web_element_displayed_in_dom(self.__bootstrap_elements.img_render_interface, time_out)
        self.wait_for_web_element_invisible(self.__bootstrap_elements.img_render_interface, time_out)

    @log_action_keyword
    def wait_for_loading_bar_invisible(self, time_out="60s"):
        self.wait_for_web_element_is_removed_in_dom(self.__bootstrap_elements.img_loading_bar, time_out)

    @log_action_keyword
    def wait_for_web_element_can_interaction(self, web_element, time_out="60s"):
        try:
            self.wait_for_web_element_visible(web_element, time_out)
            self.selenium.wait_until_element_is_enabled(web_element, time_out)
        except (StaleElementReferenceException, WebDriverException) as e:
            self.log_info_xml("Has error on wait for web element can interaction " + str(e))
            self.wait_for_web_element_displayed_in_dom(web_element, time_out)
            self.wait_for_web_element_visible(web_element, time_out)
            self.selenium.wait_until_element_is_enabled(web_element, time_out)

    @log_action_keyword
    def wait_for_web_element_visible(self, web_element, time_out="60s"):
        try:
            self.selenium.wait_until_element_is_visible(web_element, time_out)
        except (StaleElementReferenceException, WebDriverException) as e:
            self.log_info_xml("Has error on wait for web element visible " + str(e))
            self.wait_for_web_element_displayed_in_dom(web_element, time_out)
            self.wait_for_web_element_visible(web_element, time_out)

    @log_action_keyword
    def wait_for_web_element_invisible(self, web_element, time_out="60s"):
        try:
            self.selenium.wait_until_element_is_not_visible(web_element, time_out)
        except (StaleElementReferenceException, WebDriverException) as e:
            self.log_info_xml("Has error on wait for web element invisible " + str(e))
            self.selenium.wait_until_element_is_not_visible(web_element, time_out)

    @log_action_keyword
    def wait_for_web_element_displayed_in_dom(self, web_element, time_out='60s'):
        try:
            self.selenium.wait_until_page_contains_element(web_element, time_out)
        except (StaleElementReferenceException, WebDriverException) as e:
            self.log_info_xml("Has error on wait for web element displayed in DOM " + str(e))
            self.selenium.wait_until_page_contains_element(web_element, time_out)

    @log_action_keyword
    def wait_for_web_element_is_removed_in_dom(self, web_element, time_out='60s'):
        try:
            self.selenium.wait_until_page_does_not_contain_element(web_element, time_out)
        except (StaleElementReferenceException, WebDriverException) as e:
            self.log_info_xml("Has error on wait for web element removed in DOM " + str(e))
            self.selenium.wait_until_page_does_not_contain_element(web_element, time_out)

    # endregion

    # region Find Element or List Elements

    @log_action_keyword
    def get_list_web_elements(self, locator):
        if type(locator) is not WebElement:
            try:
                list_web_elements = self.selenium.get_webelements(locator)
            except ValueError:
                return []
            except StaleElementReferenceException:
                self.log_info("Error in get list web element")
                list_web_elements = self.selenium.get_webelements(locator)
            return list_web_elements
        else:
            return locator

    @log_action_keyword
    def get_web_element(self, locator):
        if type(locator) is not WebElement:
            try:
                web_element = self.selenium.get_webelement(locator)
            except StaleElementReferenceException:
                self.log_info("Error in get web element")
                web_element = self.selenium.get_webelement(locator)
            return web_element
        else:
            return locator

            # endregion

            # endregion


class BaseActionsPage(WebElementActions, LogAction, ConvertActions, DataBaseAction):
    def __init__(self):
        super(BaseActionsPage, self).__init__()
