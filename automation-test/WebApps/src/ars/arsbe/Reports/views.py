from .serializers import ReportSerializer
from .models import Reports
from ..Core.BaseAPIView import BaseAPIView
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class ReportList(APIView):
    """
    List all snippets, or create a new snippet.
    """

    def get(self, request, format=None):
        reports = Reports.objects.all()
        serializer = ReportSerializer(reports, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = ReportSerializer(data=request.data, required=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportDetail(APIView):
    """
    Retrieve, update or delete a snippet instance.
    """

    def get_object(self, pk):
        try:
            return Reports.objects.get(pk=pk)
        except Reports.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        report = self.get_object(pk)
        serializer = ReportSerializer(report)
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        report = self.get_object(pk)
        serializer = ReportSerializer(report, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        report = self.get_object(pk)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReportsAPI(BaseAPIView):
    def __init__(self):
        super(ReportsAPI, self).__init__()

    def get(self, request, *args, **kwargs):
        super(ReportsAPI, self).get(request, *args, **kwargs)
        response_method = getattr(self, str(self.function_name), None)
        if response_method is not None:
            return response_method()
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)

    def latest_list_report(self):
        reports = Reports.objects.get_list_report_execution_by_week()
        serializer = ReportSerializer(reports, many=True)
        return Response(serializer.data)
