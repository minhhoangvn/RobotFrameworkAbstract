from django.shortcuts import render
from django.contrib.auth import logout, login, authenticate
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.shortcuts import redirect
from django.http import JsonResponse


class Login(View):
    @method_decorator(ensure_csrf_cookie)
    def get(self, request, *args, **kwargs):
        return render(request, "ars/login.html", {"invalid_user": request.GET.get('invalid', None)})

    @method_decorator(ensure_csrf_cookie)
    def post(self, request, *args, **kwargs):
        data = request.POST
        username = data.get('username', None)
        password = data.get('password', None)
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                return JsonResponse({"message": "login successfully", "url": "/home/", "status": 200})
            else:
                return JsonResponse(
                    {"message": "account is deactivate, please contact admin", "url": "/accounts/login/",
                     "status": 200})
        return JsonResponse(
            {"message": "invalid username or password", "url": "/accounts/login/", "status": 200})


class Logout(View):
    @method_decorator(ensure_csrf_cookie)
    def get(self, request, *args, **kwargs):
        logout(request)
        return render(request, "ars/login.html", {})
