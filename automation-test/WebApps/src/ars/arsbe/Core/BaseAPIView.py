__author__ = 'hminh'

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class BaseAPIView(APIView):
    def __init__(self):
        super(BaseAPIView, self).__init__()
        self.__request_function = None
        self.__function_name = None
        self.__query_string = None

    @property
    def request_function(self):
        return self.__request_function

    @property
    def function_name(self):
        return self.__function_name

    @property
    def query_string(self):
        return self.__query_string

    def get(self, request, *args, **kwargs):
        if len(request.GET) > 0:
            self.__get_request_function_name(request.GET)
            self.__get_func_method_name(self)

    def post(self, request, *args, **kwargs):
        if len(request.POST) > 0:
            self.__get_request_function_name(request.POST)
            self.__get_func_method_name(self)

    def __get_request_function_name(self, request):
        self.__request_function = request.get('func', None)
        query_string = request.dict()
        self.__query_string = {key: value for key, value in query_string.items() if key != "func"}

    def __get_func_method_name(self, class_instance):
        for func_name in (dir(class_instance)):
            if self.__request_function.lower() == func_name.replace("_", "").lower():
                self.__function_name = func_name
