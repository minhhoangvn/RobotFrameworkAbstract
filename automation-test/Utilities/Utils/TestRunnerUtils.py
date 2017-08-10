__author__ = 'hminh'

from XMLUtils import XMLHelper


class TestRunnerHelper(object):
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'

    def __init__(self, xml_file_path):
        self.__runner_config = None
        self.__xml_helper = XMLHelper(xml_file_path)
        self.__sut_information = self.__parse_sut_information()
        self.__notification_information = self.__parse_notification_information()
        self.__config_information = self.__parse_config_information()

    # region Test Runner Value For System Under Test

    @property
    def base_url(self):
        return self.__sut_information['baseurl']

    @property
    def url(self):
        return self.__sut_information['url']

    @property
    def user_login(self):
        return self.__sut_information['user']

    @property
    def password_login(self):
        if self.__sut_information['pass'] is None:
            return ""
        return self.__sut_information['pass']

    @property
    def database_name(self):
        return self.__sut_information['databasename']

    @property
    def database_port(self):
        return self.__sut_information['port']

    @property
    def database_host(self):
        return self.__sut_information['host']

    @property
    def database_login_user(self):
        return self.__sut_information['dbuser']

    @property
    def database_login_password(self):
        return self.__sut_information['dbpass']

    @property
    def database_sql_source_scripts_path(self):
        return self.__sut_information['sql-source-scipts']

    # endregion

    # region Test Runner Value For Config

    @property
    def project_path(self):
        return self.__config_information['project-path']

    @property
    def project_name(self):
        return self.__config_information['project-name']

    @property
    def browser(self):
        return self.__config_information['browser']

    @property
    def is_maximize_browser(self):
        return self.__config_information['maximize']

    @property
    def is_hidden_browser(self):
        return self.__config_information['hidden']

    @property
    def wip_file_destination_path(self):
        return self.__config_information['wipdestinationpath']

    @property
    def generator_tool_path(self):
        return self.__config_information['generatortool']

    @property
    def base_wip_file_generator_tool_path(self):
        return self.__config_information['basewipgeneratortool']

    @property
    def scenarios_generator_tool_path(self):
        return self.__config_information['scenarioswipgeneratortool']

    @property
    def scenarios_generator_tool_out_put_path(self):
        return self.__config_information['wipgeneratortooloutput']

    @property
    def java_jdk_path(self):
        if len(self.__config_information['jdk-path']) == 0:
            raise ValueError("Missing JDK path in test runner config xml")
        return self.__config_information['jdk-path']
    # endregion

    # region Notification Information

    @property
    def send_after_test_flag(self):
        return self.__notification_information['enable-send-each-end-test']

    @property
    def email_domain(self):
        return self.__notification_information['email-host']

    @property
    def from_email(self):
        return self.__notification_information['from-email']

    @property
    def attachment_file_name(self):
        return self.__notification_information['attachment-file-name']

    @property
    def credential_enable(self):
        return self.__notification_information['credential-enable']

    @property
    def mail_username(self):
        return self.__notification_information['mail-username']

    @property
    def mail_password(self):
        return self.__notification_information['mail-password']

    @property
    def mail_subject(self):
        return self.__notification_information['email-subject']

    @property
    def to_emails(self):
        return self.__notification_information['to-emails']

    # endregion

    # region Parse runner-config.xml

    def __parse_sut_information(self):
        sut_information = self.__xml_helper.get_list_elements_value(self.__xml_helper.get_child_element("SUT"))
        return sut_information

    def __parse_notification_information(self):
        notification_information = self.__xml_helper.get_list_elements_value(
            self.__xml_helper.get_child_element("NOTIFICATION"))
        return notification_information

    def __parse_config_information(self):
        report_information = self.__xml_helper.get_list_elements_value(self.__xml_helper.get_child_element("CONFIG"))
        return report_information

    # endregion

    # region Source runner-config.xml

    @property
    def get_sut_information(self):
        return self.__sut_information

    @property
    def get_notification_information(self):
        return self.__notification_information

    @property
    def get_config_information(self):
        return self.__config_information

    # endregion
    '''
    End
    '''
