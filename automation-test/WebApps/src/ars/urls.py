"""ars URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import include, url
from django.contrib import admin

urlpatterns = [
    url(r'^admin/', admin.site.urls, name='admin'),
    url(r'^', include('ars.arsbe.Home.urls')),
    url(r'^(a|A)ccounts/', include('ars.arsbe.Authenticate.urls')),
    url(r'(h|H)ome/', include('ars.arsbe.Home.urls')),
    url(r'(r|R)eports/', include('ars.arsbe.Reports.urls')),
    url(r'(r|R)eports(A|a)ssets/', include('ars.arsbe.ReportsAssets.urls')),
    url(r'(s|S)uite(S|s)tatistic/', include('ars.arsbe.SuiteStatistic.urls')),
    url(r'(t|T)est(S|s)tatistic/', include('ars.arsbe.TestStatistic.urls')),
    url(r'(t|T)est(S|s)cript(d|D)ata/', include('ars.arsbe.TestScriptData.urls')),
    url(r'(e|E)xecution(S|s)tatus(d|D)esc/', include('ars.arsbe.ExecutionStatusDescription.urls')),
]
