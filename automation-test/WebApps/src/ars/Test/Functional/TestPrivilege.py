from selenium import webdriver
from django.core.urlresolvers import reverse
from django.contrib.staticfiles.testing import StaticLiveServerTestCase


class TestLogin(StaticLiveServerTestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()

    def test_log_in_valid_user(self):
        self.__action_navigate()
        self.__action_login("minhhoang", "0934058877@")
        self.assertTrue(self.driver.title == "Site administration | Django site admin")

    def test_log_in_invalid_user(self):
        self.__action_navigate()
        self.__action_login("nsang", "0934058877@")
        self.assertTrue(
            "Please enter the correct username and password for a staff account. "
            "Note that both fields may be case-sensitive." in self.driver.find_element_by_css_selector(
                "p[class='errornote']").text)

    def test_log_in_for_failed_case(self):
        self.__action_navigate()
        self.__action_login("nsang", "0934058877@")
        self.assertTrue(self.driver.title == "Site administration | Django site admin")

    def test_log_in_failed_with_sql_injection(self):
        self.__action_navigate()
        self.__action_login("minhhoang", "' or 1=1")
        self.assertTrue(
            "Please enter the correct username and password for a staff account. "
            "Note that both fields may be case-sensitive." in self.driver.find_element_by_css_selector(
                "p[class='errornote']").text)

    def __action_navigate(self):
        self.driver.get(self.get_full_url('admin'))
        self.driver.maximize_window()

    def __action_login(self, user, password):
        self.driver.find_element_by_id('id_username').send_keys(user)
        self.driver.find_element_by_id('id_password').send_keys(password)
        self.driver.find_element_by_css_selector("input[value='Log in']").click()

    def get_full_url(self, namespace):
        print (self.live_server_url)
        return self.live_server_url + '/' + namespace

    def tearDown(self):
        self.driver.close()


