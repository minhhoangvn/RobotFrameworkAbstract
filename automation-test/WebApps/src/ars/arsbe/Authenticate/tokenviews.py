__author__ = "mh"
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import json

class GenerateUserToken(APIView):
    permission_classes = (AllowAny,)

    def __init__(self):
        super(GenerateUserToken,self).__init__()
        self.__username = None
        self.__password = None

    def post(self, request, *args, **kwargs):
        self.__get_login_data(request, request.META["CONTENT_TYPE"])
        user = authenticate(username=self.__username, password=self.__password)
        if user is not None:
            if user.is_active:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({'token': token.key})
        return Response({"Error": "Invalid username or password."}, status=status.HTTP_200_OK)

    def __get_login_data(self, request, content_type):
        if "json" in content_type:
            data = json.loads(request.body)
            self.__username = data['username']
            self.__password = data['password']
        else:
            self.__username = request.POST.get('username', None)
            self.__password = request.POST.get('password', None)


class ExpireToken(APIView):
    def post(self, request, *args, **kwargs):
        request.user.auth_token.delete()
        return Response({"status": "Successfully expire token"}, status=status.HTTP_200_OK)
