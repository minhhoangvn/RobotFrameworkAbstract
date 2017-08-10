# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.conf import settings
from django.db import models
from .managers import ReportsManager
from django.utils import timezone
from ..ExecutionStatusDescription.models import ExecutionStatusDescription


class Reports(models.Model):
    objects = ReportsManager()

    class Meta:
        db_table = 'ars_reports'
        ordering = ('report_id',)

    report_id = models.AutoField(primary_key=True, unique=True)
    execution_status = models.ForeignKey(ExecutionStatusDescription, db_column='execution_status')
    execution_time = models.DurationField(null=True, default=None)
    execution_date = models.DateTimeField(default=timezone.now)
    total_suites_passed = models.IntegerField(default=0)
    total_suites_failed = models.IntegerField(default=0)
    total_suites = models.IntegerField(default=0)
