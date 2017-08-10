from django.db import models
from .managers import TestScriptDataManager


class TestScripData(models.Model):
    objects = TestScriptDataManager()

    class Meta:
        db_table = 'ars_test_script_data'
        ordering = ('test_script_id',)

    test_script_id = models.AutoField(primary_key=True, unique=True)
    test_script_name = models.CharField(max_length=254)
    test_script_source_file = models.TextField(null=True)
