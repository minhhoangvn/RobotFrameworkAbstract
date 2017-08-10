__author__ = 'hminh'
from rest_framework import serializers
from .models import Reports


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reports
        fields = ('report_id', 'execution_status', 'execution_time', 'execution_date',
                  'total_suites_passed',
                  'total_suites_failed', 'total_suites')
        read_only_fields = ('report_id',)

    def create(self, validated_data):
        return Reports.objects.create_new_report(**validated_data)
