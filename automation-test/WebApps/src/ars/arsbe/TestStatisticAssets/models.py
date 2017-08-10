from django.db import models
from .managers import TestStatisticAssetsManager
from ..TestStatistic.models import TestStatistic


class TestStatisticAssets(models.Model):
    objects = TestStatisticAssetsManager()

    class Meta:
        db_table = 'ars_test_statistic_assets'
        ordering = ('test_statistic_asset_id',)

    test_statistic_asset_id = models.AutoField(primary_key=True, unique=True)
    test_statistic_id = models.ForeignKey(TestStatistic, db_column='test_statistic_id')
    test_statistic_asset_raw_file = models.FileField(default=None)
    test_statistic_asset_file_name = models.CharField(max_length=254)
    test_statistic_asset_file_path = models.FilePathField(default=None)
    test_statistic_asset_image = models.ImageField(default=None)
