__author__ = "mh"
from selenium import webdriver
from django.core.urlresolvers import reverse
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
import time

class TestHomePage(StaticLiveServerTestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()

    def test_home_title(self):
        self.driver.get(self.get_full_url("home"))
        self.assertIn("Automation System", self.driver.title)

    def test_home_robots_file(self):
        self.driver.get(self.live_server_url + "/robots.txt")
        self.assertNotIn("Not Found", self.driver.title)

    def test_home_humans_file(self):
        self.driver.get(self.live_server_url + "/humans.txt")
        self.assertNotIn("Not Found", self.driver.title)

    def test_home_invalid_file(self):
        self.driver.get(self.live_server_url + "/invalid.txt")
        self.assertIn("Not Found", self.driver.title)

    def tearDown(self):
        self.driver.quit()

    def get_full_url(self, namespace):
        print (self.live_server_url)
        return self.live_server_url + reverse(namespace)
