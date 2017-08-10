__author__ = "mh"
from rest_framework.urlpatterns import format_suffix_patterns
from django.conf.urls import url
from .views import ReportDetail, ReportList, ReportsAPI

urlpatterns = [
    url(r'^v1/all$', ReportList.as_view()),
    url(r'^v1/details/(?P<pk>[0-9]+)/$', ReportDetail.as_view()),
    url(r'^v1/api', ReportsAPI.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
