# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from .managers import TestScripAssetManager
from ..TestScriptData.models import TestScripData


class TestScripAsset(models.Model):
    TestScriptDataManagerObject = TestScripAssetManager()

    class Meta:
        db_table = 'ars_test_script_asset'
        ordering = ('test_script_asset_id',)

    test_script_asset_id = models.AutoField(primary_key=True, unique=True)
    test_script_id = models.ForeignKey(TestScripData, db_column='test_script_id')
    test_script_asset_name = models.CharField(max_length=254)
    test_script_asset_extension_file_type = models.CharField(max_length=254)
    test_script_asset_source_file = models.FileField()

