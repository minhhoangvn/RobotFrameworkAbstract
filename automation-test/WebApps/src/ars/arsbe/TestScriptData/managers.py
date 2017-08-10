__author__ = 'hminh'
from django.db import models


class TestScriptDataManager(models.Manager):
    def create_new_tests_statistic(self, **data):
        return super(TestScriptDataManager, self).create(**data)