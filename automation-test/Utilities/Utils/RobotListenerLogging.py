__author__ = 'hminh'
import time
from datetime import datetime
import httplib
import json


class ARS_API_URL(object):
    @property
    def list_ars_reports(self):
        return "/Reports/v1/all"

    @property
    def ars_report_details(self):
        return "/Reports/v1/details/"

    @property
    def list_suites_statistic(self):
        return "/SuiteStatistic/v1/all"

    @property
    def suite_statistic_details(self):
        return "/SuiteStatistic/v1/details/"

    @property
    def list_tests_statistic(self):
        return "/TestStatistic/v1/all"

    @property
    def tests_statistic_details(self):
        return "/TestStatistic/v1/details/"


class LogDetailsExecution(object):
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'
    ROBOT_LISTENER_API_VERSION = 3

    def __init__(self, user, password, ars_url='10.1.54.45', ars_port=6969):
        self.ROBOT_LIBRARY_LISTENER = self
        self.__api_url = ARS_API_URL()
        self.__start_run_time = None
        self.__report_status = None
        self.__report_id = None
        self.__suite_statistic_id = None
        self.__test_statistic_id = None
        self.__total_suites_run = 0
        self.__total_suites_passed = 0
        self.__total_suites_failed = 0
        self.__robot_logging_api = RobotLoggingAPI(user, password, ars_url, ars_port)
        self.start_run()

    def start_run(self):
        self.__start_run_time = datetime.now()
        body_data = {
            "execution_status": 2,
            "execution_date": str(self.__start_run_time.strftime("%Y-%m-%d %H:%M:%S"))
        }
        report_object = self.__robot_logging_api.post_data(self.__api_url.list_ars_reports, body=body_data,
                                                           header={'Content-type': 'application/json'})
        self.__report_id = json.loads(report_object['body'])['report_id']

    def start_suite(self, data, result):
        self.__total_suites_run += 1
        body_data = {
            "suites_name": data.name,
            "report_id": self.__report_id,
            "execution_status": 2,
            "execution_date": str(datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            "total_tests_passed": 0,
            "total_tests_failed": 0,
            "total_tests": data.test_count
        }
        report_object = self.__robot_logging_api.post_data(self.__api_url.list_suites_statistic, body=body_data,
                                                           header={'Content-type': 'application/json'})
        self.__suite_statistic_id = json.loads(report_object['body'])['suites_statistic_id']

    def start_test(self, data, result):
        body_data = {
            "test_script_name": data.name,
            "suites_statistic_id": self.__suite_statistic_id,
            "execution_status": 2,
            "execution_date": str(datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
            "test_statistic_error_message": "N/A"
        }
        report_object = self.__robot_logging_api.post_data(self.__api_url.list_tests_statistic, body=body_data,
                                                           header={'Content-type': 'application/json'})
        self.__test_statistic_id = json.loads(report_object['body'])['test_statistic_id']

    def end_test(self, data, result):
        body_data = {
            "test_script_name": data.name,
            "suites_statistic_id": self.__suite_statistic_id,
            "execution_status": 3 if result.passed is True else 4,
            "execution_time": result.elapsedtime,
            "test_statistic_error_message": str(result.message)
        }
        self.__robot_logging_api.put_data(
            self.__api_url.tests_statistic_details + str(self.__test_statistic_id), body=body_data,
            header={'Content-type': 'application/json'})

    def end_suite(self, data, result):
        self.__update_report_status(result.passed)
        body_data = {
            "suites_name": data.name,
            "report_id": self.__report_id,
            "execution_status": 3 if result.passed is True else 4,
            "execution_time": result.elapsedtime,
            "total_tests_passed": result.statistics.all.passed,
            "total_tests_failed": result.statistics.all.failed,
            "total_tests": data.test_count
        }
        self.__robot_logging_api.put_data(
            self.__api_url.suite_statistic_details + str(self.__suite_statistic_id), body=body_data,
            header={'Content-type': 'application/json'})

    def output_file(self, path):
        pass

    def close(self):
        execution_time = (datetime.now() - self.__start_run_time).total_seconds()
        body_data = {
            "execution_status": 3 if self.__report_status is True else 4,
            "execution_time": str(time.strftime('%H:%M:%S', time.gmtime(execution_time))),
            "total_suites_passed": self.__total_suites_passed,
            "total_suites_failed": self.__total_suites_failed,
            "total_suites": self.__total_suites_run
        }
        self.__robot_logging_api.put_data(self.__api_url.ars_report_details + str(self.__report_id),
                                          body=body_data,
                                          header={'Content-type': 'application/json'})

    def __update_report_status(self, suite_status):
        if suite_status is True:
            self.__total_suites_passed += 1
        else:
            self.__total_suites_failed += 1
        if self.__report_status is None or self.__report_status is True:
            self.__report_status = suite_status


class RobotLoggingAPI(object):
    def __init__(self, user, password, url, port):
        self.__token = None
        self.__user = user
        self.__pass = password
        self.__url_ars = url
        self.__port_ars = int(port)
        self.__get_authorization_token()

    @property
    def user(self):
        if self.__user is None:
            raise ValueError("User data API can not None")
        return self.__user

    @property
    def password(self):
        if self.__pass is None:
            raise ValueError("Password data API can not None")
        return self.__pass

    @property
    def url(self):
        if self.__url_ars is None:
            raise ValueError("URL data API can not None")
        return self.__url_ars

    @property
    def port(self):
        if self.__port_ars is None:
            raise ValueError("Port data API can not None")
        return self.__port_ars

    @property
    def token(self):
        return self.__token

    def post_data(self, url, body={}, header={'Content-type': 'application/json'}):
        header['Authorization'] = self.token
        connection = self.__create_connection()
        connection.request('POST', str(url), body=json.dumps(body), headers=header)
        return self.__return_response(connection.getresponse())

    def put_data(self, url, body={}, header={'Content-type': 'application/json'}):
        header['Authorization'] = self.token
        connection = self.__create_connection()
        url = url if str(url).endswith('/') else url + '/'
        connection.request('PUT', str(url), body=json.dumps(body), headers=header)
        return self.__return_response(connection.getresponse())

    def get_data(self, url, body={}, header={'Content-type': 'application/json'}):
        connection = self.__create_connection()
        header['Authorization'] = self.token
        connection.request('GET', str(url), body=json.dumps(body), headers=header)
        return self.__return_response(connection.getresponse())

    def __get_authorization_token(self):
        try:
            header = {'Content-type': 'application/json'}
            body = json.dumps({"username": self.user, "password": self.password})
            connection = self.__create_connection()
            connection.request(
                "POST", "/accounts/v1/token/create/", body, header)
            response = connection.getresponse()
            self.__token = "Token " + str(json.loads(response.read())['token'])
        except Exception as e:
            raise ValueError(
                str(e) + ". User Login" + str(
                    self.user) + " -- user pass" + self.password + " -- connection url" + self.url +
                " -- connection port" + self.port)

    def __create_connection(self):
        try:
            return httplib.HTTPConnection(self.url, self.port)
        except Exception as e:
            raise ValueError(
                str(e) + ". User Login" + str(
                    self.user) + " -- user pass" + self.password + " -- connection url" + self.url +
                " -- connection port" + self.port)

    def __return_response(self, rs):
        response_header = rs.getheaders()
        response_body = rs.read()
        return {"header": response_header, "body": response_body}
