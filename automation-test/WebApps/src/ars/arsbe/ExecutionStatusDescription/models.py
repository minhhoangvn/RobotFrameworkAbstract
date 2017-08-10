# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models


class ExecutionStatusDescription(models.Model):
    class Meta:
        db_table = 'ars_execution_status_description'
        ordering = ('execution_status_id',)

    execution_status_id = models.AutoField(primary_key=True, unique=True)
    execution_desc = models.CharField(max_length=254, null=False)
