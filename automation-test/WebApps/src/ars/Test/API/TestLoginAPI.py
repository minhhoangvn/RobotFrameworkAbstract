__author__ = 'hminh'
from django.test import TestCase
from django.contrib.auth import get_user_model
from WebApps.src.ars.Pages.Reports.models import Reports

class TestLoginAPI(TestCase):
    def test_login_valid_user(self):
        User = get_user_model()
        user = User.objects.create(
            username="testaccount", password="abcd")

        print(user)
        print(user.profile)

