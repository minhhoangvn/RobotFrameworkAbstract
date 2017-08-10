# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from .serializers import ExecutionStatusDescriptionSerializer
from .models import ExecutionStatusDescription
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser


class ExecutionStatusList(APIView):
    permission_classes = (IsAdminUser,)
    """
    List all snippets, or create a new snippet.
    """

    def get(self, request, format=None, *args):
        reports = ExecutionStatusDescription.objects.all()
        serializer = ExecutionStatusDescriptionSerializer(reports, many=True)
        return Response(serializer.data)

    def post(self, request, format=None, *args):
        serializer = ExecutionStatusDescriptionSerializer(data=request.data, required=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExecutionStatusDetail(APIView):
    """
    Retrieve, update or delete a snippet instance.
    """

    def get_object(self, pk, *args):
        try:
            return ExecutionStatusDescription.objects.get(pk=pk)
        except ExecutionStatusDescription.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None, *args):
        report = self.get_object(pk)
        serializer = ExecutionStatusDescriptionSerializer(report)
        return Response(serializer.data)

    def put(self, request, pk, format=None, *args):
        report = self.get_object(pk)
        serializer = ExecutionStatusDescriptionSerializer(report, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None, *args):
        report = self.get_object(pk)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
