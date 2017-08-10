__author__ = "mh"
from rest_framework.urlpatterns import format_suffix_patterns
from django.conf.urls import url
from .views import TestsStatisticList, TestsStatisticDetail

urlpatterns = [
    url(r'^v1/all$', TestsStatisticList.as_view()),
    url(r'^v1/details/(?P<pk>[0-9]+)/$', TestsStatisticDetail.as_view()),

]

urlpatterns = format_suffix_patterns(urlpatterns)
