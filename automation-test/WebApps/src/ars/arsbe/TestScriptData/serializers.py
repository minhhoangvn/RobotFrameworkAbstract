__author__ = 'hminh'
from rest_framework import serializers
from .models import TestScripData


class TestScripDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestScripData
        fields = ('test_script_id', 'test_script_name', 'test_script_source_file')
        read_only_fields = ('test_script_id',)

    def create(self, validated_data):
        return TestScripData.TestScriptDataManagerObject.create_new_tests_statistic(**validated_data)
