__author__ = 'hminh'
from rest_framework import serializers
from .models import SuitesStatistic


class SuitesStatisticSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuitesStatistic
        fields = ('suites_statistic_id', 'suites_name', 'report_id', 'execution_status',
                  'execution_time', 'execution_date', 'total_tests_passed', 'total_tests_failed', 'total_tests')
        read_only_fields = ('suites_statistic_id',)

    def create(self, validated_data):
        return SuitesStatistic.objects.create_new_suites_statistic(**validated_data)
