__author__ = 'hminh'
from django.db import models
from datetime import date, datetime, timedelta
from django.utils import timezone


class ReportsManager(models.Manager):
    def get_list_passed_reports(self):
        return super(ReportsManager, self).get_queryset().filter(execution_status=3)

    def get_list_failed_reports(self):
        return super(ReportsManager, self).get_queryset().filter(execution_status=4)

    def get_list_all_reports(self):
        return super(ReportsManager, self).get_queryset()

    def create_new_report(self, **data):
        return super(ReportsManager, self).create(**data)

    def get_list_report_execution_by_week(self):
        last7days = timezone.now() + timedelta(days=-7)
        return super(ReportsManager, self).get_queryset().filter(execution_date__gte=last7days)
