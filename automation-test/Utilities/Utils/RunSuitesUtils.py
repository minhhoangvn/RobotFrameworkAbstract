__author__ = 'hminh'
import datetime
import os
import sys

from robot import run as robot_run

from Utilities.DataHelper.ExcelExtension import ExcelUtility
from Utilities.Utils.DateTimeUtils import DateTimeHelper
from Utilities.Utils.RobotListenerExtend import Notification, LogDetailsExecution
from Utilities.Utils.SystemUtils import SystemHelper
from Utilities.Utils.TestRunnerUtils import TestRunnerHelper


class RunSuites(object):
    def __init__(self, suite_data_file, sheet_name, runner_config_path,
                 email_template, resource_config_path=None, report_path=None):
        self.__system_helper = SystemHelper()
        self.__excel_reader = ExcelUtility()
        self.__date_time = DateTimeHelper()
        self.email_template = email_template
        self.suite_runner_data = self.__excel_reader.read_all_rows_values(suite_data_file, sheet_name)
        self.resource_config_path = resource_config_path
        self.runner_config_path = runner_config_path
        self.report_path = report_path
        self.execution_runner_config_data = runner_config_path
        self.__log_info_config_suites(suite_data_file, sheet_name)

    # region Properties

    __test_case_templates_path = {}
    __test_runner_helper = None
    __suite_data_file = None
    __suites_runner_data = None
    __test_case_template_source = None
    __report_path = None
    __time_stamp = None
    __resource_config_path = None
    __runner_config_path = None
    __test_template_name = None
    __test_case_run_flag = None
    __test_case_name = None
    __email_list = None

    @property
    def execution_runner_config_data(self):
        return self.__test_runner_helper

    @execution_runner_config_data.setter
    def execution_runner_config_data(self, path):
        self.__test_runner_helper = TestRunnerHelper(str(path).replace("\\", "\\\\"))

    @property
    def resource_config_path(self):
        return self.__resource_config_path

    @resource_config_path.setter
    def resource_config_path(self, path):
        self.__resource_config_path = str(path).replace("\\", "\\\\")

    @property
    def runner_config_path(self):
        return self.__runner_config_path

    @runner_config_path.setter
    def runner_config_path(self, path):
        self.__runner_config_path = str(path).replace("\\", "\\\\")

    @property
    def test_suites_folder(self):
        if self.__time_stamp is None:
            self.__time_stamp = self.__date_time.get_time_stamp_in_string_value
        return self.execution_runner_config_data.project_path + os.path.sep + "Test Suites" + os.path.sep + "Suites_" + self.__time_stamp

    @property
    def suite_runner_data(self):
        return self.__suites_runner_data

    @suite_runner_data.setter
    def suite_runner_data(self, data):
        self.__suites_runner_data = data

    @property
    def test_template_name(self):
        return self.__test_template_name

    @test_template_name.setter
    def test_template_name(self, test_template_name):
        self.__test_template_name = test_template_name

    @property
    def test_case_template_source(self):
        return self.__test_case_template_source

    @test_case_template_source.setter
    def test_case_template_source(self, template_source):
        self.__test_case_template_source = template_source

    @property
    def test_case_run_flag(self):
        return self.__test_case_run_flag

    @test_case_run_flag.setter
    def test_case_run_flag(self, is_running):
        self.__test_case_run_flag = is_running

    @property
    def test_case_name(self):
        return self.__test_case_name

    @test_case_name.setter
    def test_case_name(self, test_case_name):
        self.__test_case_name = test_case_name

    @property
    def report_path(self):
        return self.__report_path

    @report_path.setter
    def report_path(self, path):
        if path is None:
            path = self.execution_runner_config_data.project_path + os.path.sep + "Test Report"
        self.__report_path = path

    # endregion

    def run_suite(self):
        self.__create_test_suites_folder()
        self.__create_suite_file()
        self.__run_suite()

    def __create_test_suites_folder(self):
        self.__system_helper.create_new_folder(self.test_suites_folder)

    def __create_suite_file(self):
        for runner_data in self.suite_runner_data:
            try:
                runner_data = self.__convert_runner_data(runner_data, self.resource_config_path)
                if self.test_case_run_flag == 'Y':
                    self.__save_test_templates_path()
                    test_case_template_path = self.__test_case_templates_path[self.test_template_name + ".txt"]
                    with open(test_case_template_path, "r") as f:
                        self.test_case_template_source = f.read()
                    test_case_source = self.test_case_template_source.format(*runner_data)
                    with open(self.test_suites_folder + os.path.sep + self.test_case_name + ".txt", 'w') as f:
                        f.write(test_case_source)
                        print ("Done create test [" + self.test_case_name + "] with data " + str(runner_data))
            except Exception as e:
                print ("Has error in generate test case [" + str(e.message) + "]")

    def __run_suite(self):
        robot_run(self.test_suites_folder,
                  outputdir=self.report_path,
                  variable=[
                      "PROJECT_PATH_CMD:" + self.execution_runner_config_data.project_path +
                      os.path.sep + self.execution_runner_config_data.project_name,
                      "XML_CONFIG_PATH:" + self.runner_config_path],
                  splitlog=True,
                  listener=[Notification(self.report_path,
                                         self.email_template,
                                         self.execution_runner_config_data
                                         ),
                            LogDetailsExecution(self.report_path)
                            ],
                  debugfile=self.report_path + os.path.sep + "debug.log"
                  )

    def __convert_runner_data(self, runner_data, config_path):
        test_case_name_index = 1
        end_index_test_template_data = len(runner_data) - 1
        self.test_template_name = runner_data[0]
        self.test_case_name = runner_data[test_case_name_index]
        self.test_case_run_flag = runner_data[end_index_test_template_data]
        runner_data = runner_data[test_case_name_index:end_index_test_template_data]
        if config_path is not None:
            runner_data.insert(0, config_path)
        return runner_data

    def __save_test_templates_path(self):
        if self.test_template_name + ".txt" not in self.__test_case_templates_path.iterkeys():
            self.__test_case_templates_path[
                self.test_template_name + ".txt"] = self.__system_helper.get_file_path_by_file_name(
                self.execution_runner_config_data.project_path +
                os.path.sep +
                self.execution_runner_config_data.project_name +
                os.path.sep +
                "Test_Cases",
                self.test_template_name + ".txt")

    def __log_info_config_suites(self, suite_data_file, sheet_name):
        print ("======================================================================================================")
        print ("======================================================================================================")
        print ("========================================= RUN  SUITES OPTIONS ========================================")
        print ("======================================================================================================")
        print ("======================================================================================================")
        print ("")
        print ("Project Path: " + self.execution_runner_config_data.project_path)
        print ("Database: " + self.execution_runner_config_data.database_name)
        print ("SUT URL: " + self.execution_runner_config_data.base_url)
        print ("Run Suites File: " + suite_data_file)
        print ("Run Suites Sheet Name: " + sheet_name)
        print ("Resource Config File: " + self.resource_config_path)
        print ("Runner Config File: " + self.runner_config_path)
        print ("Project Name: " + self.execution_runner_config_data.project_name)
        print ("Report Directory: " + self.report_path)
        print ("Email Template: " + self.email_template.__module__)
        print ("")
        print ("======================================================================================================")
        print ("======================================================================================================")
        print ("======================================================================================================")


if __name__ == "__main__":
    if len(sys.argv) < 6:
        print ("Missing parameter")
    print sys.argv[1]
    print sys.argv[2]
    print sys.argv[3]
    print sys.argv[4]
    print sys.argv[5]
    print sys.argv[6]
    print sys.argv[7]
    run_suites = RunSuites(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])
    run_suites.run_suite()
