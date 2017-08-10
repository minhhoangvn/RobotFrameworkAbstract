__author__ = 'hminh'
from django.db import models


class TestStatisticManager(models.Manager):
    def create_new_tests_statistic(self, **data):
        return super(TestStatisticManager, self).create(**data)
