__author__ = 'hminh'
import os

from Utilities.DataHelper.ExcelExtension import ExcelUtility
from Utilities.Utils.DateTimeUtils import DateTimeHelper
from Utilities.Utils.SystemUtils import SystemHelper
from Utilities.Utils.TestRunnerUtils import TestRunnerHelper
from VMS.Utils.Constants import Constants
from robot.libraries.BuiltIn import BuiltIn, RobotNotRunningError
from Selenium2Library import Selenium2Library


class BaseObjectPage(object):
    def __init__(self):
        self.__current_file_path = __file__
        self.__robot_built_in = None
        self.__selenium = None
        self.__excel_helper = None
        self.__constant = None
        self.__system_helper = None
        self.__test_runner_helper = None
        self.__date_time_helper = None
        self.__instance_libs()

    @property
    def excel_helper(self):
        return self.__excel_helper

    @property
    def date_time_helper(self):
        return self.__date_time_helper

    @property
    def system_helper(self):
        return self.__system_helper

    @property
    def test_runner(self):
        return self.__test_runner_helper

    @property
    def const(self):
        return self.__constant

    @property
    def selenium(self):
        return self.__selenium

    @property
    def robot_built_in(self):
        return self.__robot_built_in

    @property
    def web_driver(self):
        return self.__selenium._current_browser()

    def __instance_libs(self):
        try:
            self.__init_utils_class()
            self.__selenium = self.__robot_built_in.get_library_instance('Selenium2Library')
        except RobotNotRunningError:
            self.__is_instance_libs_in_robot()
            self.__selenium = Selenium2Library()

    def __is_instance_libs_in_robot(self):
        self.__init_utils_class()
        import inspect
        stack = inspect.stack()
        for frame_object in stack:
            for value in frame_object:
                try:
                    if value.f_locals["self"].__class__ is not None:
                        pass
                except AttributeError:
                    # TODO
                    # Write code for checking if using RIDE or run on robot get exception
                    # in instance libs
                    pass
                except KeyError:
                    # TODO
                    # Write code for checking if using RIDE or run on robot get exception
                    # in instance libs
                    pass

    # TODO create factory for instance Utitlies class
    def __init_utils_class(self):
        self.__excel_helper = ExcelUtility()
        self.__date_time_helper = DateTimeHelper()
        self.__constant = Constants()
        self.__system_helper = SystemHelper()
        self.__robot_built_in = BuiltIn()
        self.__test_runner_helper = TestRunnerHelper(self.__get_runner_config_path())

    def __get_runner_config_path(self):
        try:
            if self.robot_built_in.get_variable_value("${XML_CONFIG_PATH}") is not None:
                return self.robot_built_in.get_variable_value("${XML_CONFIG_PATH}")
            return self.system_helper.get_file_path_by_file_name(
                os.path.abspath(os.path.split(os.path.abspath(__file__))[0] + os.path.sep + ".." + os.path.sep + ".."),
                "RunnerConfig.xml")
        except RobotNotRunningError:
            return self.system_helper.get_file_path_by_file_name(
                os.path.abspath(os.path.split(os.path.abspath(__file__))[0] + os.path.sep + ".." + os.path.sep + ".."),
                "RunnerConfig.xml")
