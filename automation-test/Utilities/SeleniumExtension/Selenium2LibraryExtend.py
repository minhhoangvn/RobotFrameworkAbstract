__author__ = 'hminh'
from robot.libraries.BuiltIn import BuiltIn
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.common.exceptions import WebDriverException,TimeoutException
class Selenium2LibrariesExtend(object):
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'

    def __init__(self):
        self._BuiltIn = None
        self._Selenium_2_Library = None

    def navigate_to(self, path_page):
        self.__instance_library()
        self._BaseURL = self.__get_base_url()
        path_page = self._BaseURL + path_page
        self._Selenium_2_Library.go_to(path_page)

    def wait_for_angular_page_load(self, time_out):
        self.__instance_library()
        driver = self.__get_driver()
        wait = WebDriverWait(driver, time_out)
        wait.until(lambda wait_for_angular_loading: driver.execute_script(
            'angular.getTestability(document.body).whenStable(function(){return 1;})') == 1)

    def select_dropdown_option_by_text(self, select_element, option):
        select = Select(select_element)
        select.select_by_visible_text(option)

    def get_list_options_value(self,select_element):
        if select_element.tag_name == 'select':
            select = Select(select_element)
            list_options=[]
            options= select.options
            if len(options) >0:
                for option in options:
                    list_options.append(option.get_attribute("text"))
                return list_options
            else:
                raise ValueError("Element does not contains any options")
        else:
            raise ValueError("WebElement is not Select Tag")

    def wait_for_ajax_in_angular(self, time_out=180):
        try:
            self.__instance_library()
            driver = self.__get_driver()
            wait = WebDriverWait(driver, time_out)
            wait.until(lambda wait_all_ajax_post: driver.execute_script(
                'return angular.element(document.body).injector().get("$http").pendingRequests.length==0'))
        except WebDriverException:
            raise WebDriverException("Has error in running Angular in webdriver")
        except TimeoutException:
            raise TimeoutException("Time out after waiting for "+ str(time_out)+" seconds")

    '''
    Keyword open new tab and stored first tab as MAIN_WINDOW_HANDLE
    If user open new tab and want to set new WINDOW_HANDLE
    Please use keyword set_suites_variable in robot to replace new value
    '''
    def open_new_tab(self):
        driver = self.__get_driver()
        if self._BuiltIn.get_variable_value("${MAIN_WINDOW_HANDLE}") is None:
            self._BuiltIn.set_global_variable("${MAIN_WINDOW_HANDLE}",driver.current_window_handle)
        driver.execute_script("window.open('','_blank')")
    '''
    This method using for switch new tab
    Currently not handle if user open many new tab
    Only auto switch for first difference windows handle on list window handles
    '''
    def switch_to_new_tab(self, window_handle=None):
        if window_handle is not None:
            return driver.switch_to_window(window_handle)
        driver = self._get_driver()
        list_window_handle = driver.get_window_handles()
        if len(list_window_handle) > 1:
            main_tab = self._BuiltIn.get_variable_value("${MAIN_WINDOW_HANDLE}")
            for window in list_window_handle:
                if window != main_tab:
                    driver.switch_to_window(window)
    '''
    In Robot Framework cannot get Libs Instance before test start
    Using this medthod for getting libs
    Advoid error can not access execution contex
    This is private method
    '''
    def __instance_library(self):
        self._BuiltIn = BuiltIn()
        self._Selenium_2_Library = self._BuiltIn.get_library_instance('Selenium2Library')

    def __get_driver(self):
        return self._Selenium_2_Library._current_browser()

    def __get_base_url(self):
        if self._BuiltIn.get_variable_value('${BASE_URL_CMD}') is not None:
            return self._BuiltIn.get_variable_value('${BASE_URL_CMD}')
        if self._BuiltIn.get_variable_value('${BASE_URL}') is None:
            raise ValueError("Missing value for ${BASE_URL} in config run test suite")
        return self._BuiltIn.get_variable_value('${BASE_URL}')
