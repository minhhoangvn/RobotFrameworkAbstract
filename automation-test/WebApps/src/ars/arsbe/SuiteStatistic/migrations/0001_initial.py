# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-06-22 12:41
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('ExecutionStatusDescription', '0001_initial'),
        ('Reports', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SuitesStatistic',
            fields=[
                ('suites_statistic_id', models.AutoField(primary_key=True, serialize=False, unique=True)),
                ('suites_name', models.CharField(max_length=254)),
                ('execution_time', models.DurationField(default=None, null=True)),
                ('execution_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('total_tests_passed', models.IntegerField(default=0)),
                ('total_tests_failed', models.IntegerField(default=0)),
                ('total_tests', models.IntegerField(default=0)),
                ('execution_status', models.ForeignKey(db_column='execution_status', on_delete=django.db.models.deletion.CASCADE, to='ExecutionStatusDescription.ExecutionStatusDescription')),
                ('report_id', models.ForeignKey(db_column='report_id', on_delete=django.db.models.deletion.CASCADE, to='Reports.Reports')),
            ],
            options={
                'db_table': 'ars_suites_statistic',
                'ordering': ('suites_statistic_id',),
            },
        ),
    ]
