__author__ = 'hminh'
import os

from Base.Page.BaseActions import LogAction
from Utilities.Utils.DateTimeUtils import DateTimeHelper
from Utilities.Utils.EmailUtils import Email
from Utilities.Utils.SystemUtils import SystemHelper


class Notification(object):
    ROBOT_LISTENER_API_VERSION = 3
    BUILD_VERSION = None

    def __init__(self, report_folder_path, email_template, execution_information=[]):
        self.ROBOT_LIBRARY_LISTENER = self
        self.execution_information = execution_information
        self.email = execution_information
        self.__date_time_helper = DateTimeHelper()
        self.__system_helper = SystemHelper()
        self.__email_template = email_template
        self.__report_folder_path = report_folder_path
        self.__instance_send_mail_method()

    __test_message_report = []
    __suites_message_report = []
    __temp_zip_file_path = None
    __execution_information = None
    __email = None
    __send_email = None
    __send_email_with_attachment = None

    @property
    def email(self):
        return self.__email

    @email.setter
    def email(self, execution_information):
        self.__email = Email(
            execution_information.from_email,
            execution_information.mail_username,
            execution_information.mail_password,
            execution_information.email_domain,
            execution_information.mail_subject,
            execution_information.to_emails.replace('\n', '').replace('\t', '')
        )

    @property
    def send_email(self):
        return self.__send_email

    @property
    def send_mail_with_attachment(self):
        return self.__send_email_with_attachment

    @property
    def execution_information(self):
        return self.__execution_information

    @execution_information.setter
    def execution_information(self, execution_information):
        self.__execution_information = execution_information

    def end_test(self, data, result):
        test_status_row = '<tr class="test-status-pass">' if result.status == 'PASS' \
            else '<tr class="test-status-fail">'
        test_status_body = '<td>{0}</td>\
                            <td>{1}</td>\
                            <td>{2}</td>\
                            <td>{3}</td>\
                            <td>{4}</td>\
                            <td>{5}</td>\
                            <td>N/A for test status</td>\
                            </tr>'.format(str(data.longname), str(result.starttime), str(result.endtime),
                                          str(DateTimeHelper.convert_milliseconds_to_hours_min_seconds(
                                              result.elapsedtime)),
                                          str(result.status),
                                          str(result.message) + LogAction.get_long_error_message())
        email_message = test_status_row + test_status_body
        self.__test_message_report.extend(email_message)
        if self.execution_information.send_after_test_flag.upper() == 'TRUE':
            self.__send_notification(
                self.__email_template.html_email_template_single_status(email_message,
                                                                        self.execution_information.database_name,
                                                                        self.execution_information.base_url,
                                                                        Notification.BUILD_VERSION
                                                                        ))

    def end_suite(self, data, result):
        suite_status_row = '<tr class="suite-status-pass">' if result.status == 'PASS' \
            else '<tr class="suite-status-fail">'
        suite_status_body = '<td>{0}</td>\
                            <td>{1}</td>\
                            <td>{2}</td>\
                            <td>{3}</td>\
                            <td>{4}</td>\
                            <td>{5}</td>\
                            <td>{6}</td>\
                      </tr>'.format(str(data.longname), str(result.starttime), str(result.endtime),
                                    str(DateTimeHelper.convert_milliseconds_to_hours_min_seconds(result.elapsedtime)),
                                    str(result.status),
                                    str(result.message), str(result.stat_message))
        email_message = suite_status_row + suite_status_body
        self.__suites_message_report.extend([str(email_message)])

    def close(self):
        self.__update_css_for_final_suites_report()
        self.__attach_report()
        table_message = '<tr>' \
                        '<td colspan= "7" class= "test-statistics-header">Tests Status</td>' \
                        '</tr>' + \
                        ''.join(self.__test_message_report) + \
                        '<tr>' \
                        '<td colspan= "7" class= "suites-statistics-header">Suites Status</td>' \
                        '</tr>' + \
                        ''.join(self.__suites_message_report)
        self.__send_notification_with_attachment(
            self.__email_template.html_email_template_final_execution_statistics(table_message,
                                                                                 self.execution_information.database_name,
                                                                                 self.execution_information.base_url,
                                                                                 Notification.BUILD_VERSION),
            self.__temp_zip_file_path)
        self.__system_helper.delete_file(self.__temp_zip_file_path)

    def __update_css_for_final_suites_report(self):
        final_suites_report_html = self.__suites_message_report[len(self.__suites_message_report) - 1]
        final_suites_title_html = '<tr>' + \
                                  '<td colspan= "7" class= "final-suites-statistics-header">Final Suites Statistics' + \
                                  '</td>' + \
                                  '</tr>'
        self.__suites_message_report[
            len(self.__suites_message_report) - 1] = final_suites_title_html + final_suites_report_html

    def __instance_send_mail_method(self):
        if self.execution_information.credential_enable.upper() == 'TRUE':
            self.__create_send_mail_object()
        else:
            self.__create_send_mail_with_anonymous_object()

    def __create_send_mail_object(self):
        self.__send_email = self.email.send_email
        self.__send_email_with_attachment = self.email.send_email_with_attachment

    def __create_send_mail_with_anonymous_object(self):
        self.__send_email = self.email.send_anonymous_email
        self.__send_email_with_attachment = self.email.send_anonymous_email_with_attachment

    def __attach_report(self):
        self.__temp_zip_file_path = self.__report_folder_path + os.path.sep + ".." + os.path.sep + "Report_" + str(
            self.__date_time_helper.get_time_stamp) + ".zip"
        self.__system_helper.zip_multiple_files(self.__temp_zip_file_path, self.__report_folder_path)

    def __send_notification(self, email_message):
        self.__send_email(email_message)

    def __send_notification_with_attachment(self, email_message, attachment_path):
        self.__send_email_with_attachment(email_message, attachment_path,
                                          self.execution_information.attachment_file_name)


class LogDetailsExecution(object):
    ROBOT_LISTENER_API_VERSION = 3

    def __init__(self, report_folder_path):
        self.ROBOT_LIBRARY_LISTENER = self
        self.__final_suites_stats = None
        self.__date_time_helper = DateTimeHelper()
        self.__log_details_path = report_folder_path + os.path.sep + "SuitesDetails.log"

    def log_message(self, message):
        self.__log_details_message(message)

    def message(self, message):
        self.__log_details_message(message)

    def start_suite(self, data, result):
        self.__log_start_suite()
        self.__log_details_message(str(data.longname))

    def start_test(self, data, result):
        self.__log_start_test()
        self.__log_details_message(str(data.longname))

    def end_test(self, data, result):
        self.__log_details_message("================================== TEST RESULT ===================================")
        self.__log_details_message(str(data.longname) + ": " + result.status + " " +
                                   result.message)
        self.__log_end_test()

    def end_suite(self, data, result):
        self.__log_details_message("================================== SUITE RESULT ==================================")
        self.__log_details_message(str(data.longname) + ": " + result.stat_message + " " +
                                   str(result.message))
        self.__final_suites_stats = str(result.stat_message)
        self.__log_end_suite()

    def __log_details_message(self, message):
        with open(self.__log_details_path, 'a') as log_file:
            m = str(self.__date_time_helper.get_date_time_string_value) + ": " + str(message) + "\n"
            log_file.write(str(m))

    def __log_start_suite(self):
        self.__log_details_message("================================== START  SUITE ==================================")
        self.__log_details_message("==================================================================================")
        self.__log_details_message("==================================================================================")

    def __log_start_test(self):
        self.__log_details_message("=================================== START  TEST ==================================")
        self.__log_details_message("==================================================================================")
        self.__log_details_message("==================================================================================")

    def __log_end_test(self):
        self.__log_details_message("=================================== END  TEST ====================================")
        self.__log_details_message("==================================================================================")
        self.__log_details_message("==================================================================================")

    def __log_end_suite(self):
        self.__log_details_message("=================================== END  SUITE ===================================")
        self.__log_details_message("==================================================================================")
        self.__log_details_message("==================================================================================")

    def __log_end_execution(self):
        self.__log_details_message(self.__final_suites_stats)
        self.__log_details_message("================================== END EXECUTION =================================")
        self.__log_details_message("==================================================================================")
        self.__log_details_message("==================================================================================")
        self.__log_details_message("#  MMMMMMMM               MMMMMMMMHHHHHHHHH     HHHHHHHHH       ")
        self.__log_details_message("#  M:::::::M             M:::::::MH:::::::H     H:::::::H       ")
        self.__log_details_message("#  M::::::::M           M::::::::MH:::::::H     H:::::::H       ")
        self.__log_details_message("#  M:::::::::M         M:::::::::MHH::::::H     H::::::HH       ")
        self.__log_details_message("#  M::::::::::M       M::::::::::M  H:::::H     H:::::H         ")
        self.__log_details_message("#  M:::::::::::M     M:::::::::::M  H:::::H     H:::::H         ")
        self.__log_details_message("#  M:::::::M::::M   M::::M:::::::M  H::::::HHHHH::::::H         ")
        self.__log_details_message("#  M::::::M M::::M M::::M M::::::M  H:::::::::::::::::H         ")
        self.__log_details_message("#  M::::::M  M::::M::::M  M::::::M  H:::::::::::::::::H         ")
        self.__log_details_message("#  M::::::M   M:::::::M   M::::::M  H::::::HHHHH::::::H         ")
        self.__log_details_message("#  M::::::M    M:::::M    M::::::M  H:::::H     H:::::H         ")
        self.__log_details_message("#  M::::::M     MMMMM     M::::::M  H:::::H     H:::::H         ")
        self.__log_details_message("#  M::::::M               M::::::MHH::::::H     H::::::HH       ")
        self.__log_details_message("#  M::::::M               M::::::MH:::::::H     H:::::::H       ")
        self.__log_details_message("#  M::::::M               M::::::MH:::::::H     H:::::::H       ")
        self.__log_details_message("#  M::::::M               M::::::MH:::::::H     H:::::::H       ")
        self.__log_details_message("#  M::::::M               M::::::MH:::::::H     H:::::::H       ")
        self.__log_details_message("#  MMMMMMMM               MMMMMMMMHHHHHHHHH     HHHHHHHHH       ")
        self.__log_details_message("==================================================================================")
        self.__log_details_message("==================================================================================")
        self.__log_details_message("==================================================================================")
