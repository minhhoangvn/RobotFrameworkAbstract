__author__ = "mh"

from django.conf.urls import url
from .sessionviews import Login, Logout
from. tokenviews import GenerateUserToken, ExpireToken

urlpatterns = [
    url(r'^login(/|^)', Login.as_view(), name='login'),
    url(r'^logout(/|^)', Logout.as_view(), name='logout'),
    url(r'^v1/token/create(/|^)', GenerateUserToken.as_view(), name='create-token'),
    url(r'^v1/token/expire(/|^)', ExpireToken.as_view(), name='expire-token'),
]
