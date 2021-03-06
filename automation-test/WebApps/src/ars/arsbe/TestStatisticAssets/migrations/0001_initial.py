# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-06-22 12:41
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('TestStatistic', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TestStatisticAssets',
            fields=[
                ('test_statistic_asset_id', models.AutoField(primary_key=True, serialize=False, unique=True)),
                ('test_statistic_asset_raw_file', models.FileField(default=None, upload_to='')),
                ('test_statistic_asset_file_name', models.CharField(max_length=254)),
                ('test_statistic_asset_file_path', models.FilePathField(default=None)),
                ('test_statistic_asset_image', models.ImageField(default=None, upload_to='')),
                ('test_statistic_id', models.ForeignKey(db_column='test_statistic_id', on_delete=django.db.models.deletion.CASCADE, to='TestStatistic.TestStatistic')),
            ],
            options={
                'db_table': 'ars_test_statistic_assets',
                'ordering': ('test_statistic_asset_id',),
            },
        ),
    ]
