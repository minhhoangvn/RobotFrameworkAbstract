from .serializers import TestsStatisticSerializer
from .models import TestStatistic
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class TestsStatisticList(APIView):
    """
    List all snippets, or create a new snippet.
    """

    def get(self, request, format=None, *args, **kwargs):
        suites = TestStatistic.objects.all()
        serializer = TestsStatisticSerializer(suites, many=True)
        return Response(serializer.data)

    def post(self, request, format=None, *args, **kwargs):
        serializer = TestsStatisticSerializer(data=request.data, required=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestsStatisticDetail(APIView):
    """
    Retrieve, update or delete a snippet instance.
    """

    def get_object(self, pk):
        try:
            return TestStatistic.objects.get(pk=pk)
        except TestStatistic.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        report = self.get_object(pk)
        serializer = TestsStatisticSerializer(report)
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        report = self.get_object(pk)
        serializer = TestsStatisticSerializer(report, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        report = self.get_object(pk)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
