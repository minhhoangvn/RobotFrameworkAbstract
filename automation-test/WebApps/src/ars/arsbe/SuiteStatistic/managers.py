__author__ = 'hminh'
from django.db import models


class SuitesStatisticManager(models.Manager):
    def create_new_suites_statistic(self, **data):
        return super(SuitesStatisticManager, self).create(**data)
