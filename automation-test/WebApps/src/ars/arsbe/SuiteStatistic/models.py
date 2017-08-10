from django.db import models
from .managers import SuitesStatisticManager
from ..Reports.models import Reports
from ..ExecutionStatusDescription.models import ExecutionStatusDescription
from django.utils import timezone


class SuitesStatistic(models.Model):
    objects = SuitesStatisticManager()

    class Meta:
        db_table = 'ars_suites_statistic'
        ordering = ('suites_statistic_id',)

    suites_statistic_id = models.AutoField(primary_key=True, unique=True)
    report_id = models.ForeignKey(Reports, db_column='report_id')
    suites_name = models.CharField(max_length=254)
    execution_status = models.ForeignKey(ExecutionStatusDescription, db_column='execution_status')
    execution_time = models.DurationField(null=True, default=None)
    execution_date = models.DateTimeField(default=timezone.now)
    total_tests_passed = models.IntegerField(default=0)
    total_tests_failed = models.IntegerField(default=0)
    total_tests = models.IntegerField(default=0)
