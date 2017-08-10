__author__ = "mh"
from django.conf.urls import url, include
from rest_framework.urlpatterns import format_suffix_patterns
from django.conf.urls import url
from . import views
from .views import ReportAssetList, ReportAssetsReportFile
from rest_framework import routers


urlpatterns = [
    url(r'^v1/assets$', ReportAssetList.as_view()),
    url(r'^v1/report$', ReportAssetsReportFile.as_view()),

]

#urlpatterns = format_suffix_patterns(urlpatterns)