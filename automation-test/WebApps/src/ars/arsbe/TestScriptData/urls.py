__author__ = "mh"
from rest_framework.urlpatterns import format_suffix_patterns
from django.conf.urls import url
from .views import TestScriptsDataDetail, TestScriptsDataList

urlpatterns = [
    url(r'^v1/all$', TestScriptsDataList.as_view()),
    url(r'^v1/details/(?P<pk>[0-9]+)/$', TestScriptsDataDetail.as_view()),

]

urlpatterns = format_suffix_patterns(urlpatterns)
