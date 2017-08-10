__author__ = 'hminh'
from rest_framework import serializers
from .models import ExecutionStatusDescription


class ExecutionStatusDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutionStatusDescription
        fields = ('execution_status_id', 'execution_desc')
        read_only_fields = ('execution_status_id',)

