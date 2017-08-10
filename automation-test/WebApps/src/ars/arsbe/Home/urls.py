__author__ = "mh"

from django.conf.urls import url
from . import views
from .views import Home
urlpatterns = [
    url(r'^$', Home.as_view(), name='home'),
    url(r'(?P<file_name>(robots.txt)|(humans.txt))$', views.home_files, name='home-files'),
]
