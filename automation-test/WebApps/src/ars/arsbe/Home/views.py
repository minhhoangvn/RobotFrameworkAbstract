from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View
from django.utils.decorators import method_decorator


# Create your views here.

class Home(LoginRequiredMixin, View):
    login_url = '/accounts/login/'

    @method_decorator(ensure_csrf_cookie)
    def get(self, request, *args, **kwargs):
        return render(request, "ars/index.html", {})


@ensure_csrf_cookie
def home_files(request, file_name):
    return render(request, file_name, {}, content_type="text/plain")
