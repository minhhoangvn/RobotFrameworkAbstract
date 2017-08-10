__author__ = 'hminh'
from rest_framework import serializers
from .models import TestStatistic


class TestsStatisticSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestStatistic
        fields = ('test_statistic_id', 'test_script_name', 'suites_statistic_id', 'execution_status',
                  'execution_time', 'execution_date', 'test_statistic_error_message')
        read_only_fields = ('test_statistic_id',)

    def create(self, validated_data):
        return TestStatistic.objects.create_new_tests_statistic(**validated_data)
