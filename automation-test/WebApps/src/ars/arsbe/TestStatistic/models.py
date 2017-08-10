# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.utils import timezone
from django.db import models
from ..SuiteStatistic.models import SuitesStatistic
from ..ExecutionStatusDescription.models import ExecutionStatusDescription
from .managers import TestStatisticManager


class TestStatistic(models.Model):
    objects = TestStatisticManager()

    class Meta:
        db_table = 'ars_test_statistic'
        ordering = ('test_statistic_id',)

    test_statistic_id = models.AutoField(primary_key=True, unique=True)
    test_script_name = models.TextField(null=False, blank=False)
    suites_statistic_id = models.ForeignKey(SuitesStatistic, db_column='suites_statistic_id')
    execution_status = models.ForeignKey(ExecutionStatusDescription, db_column='execution_status')
    execution_time = models.DurationField(null=True, default=None)
    execution_date = models.DateTimeField(default=timezone.now)
    test_statistic_error_message = models.TextField(default=None, null=True, blank=True)
