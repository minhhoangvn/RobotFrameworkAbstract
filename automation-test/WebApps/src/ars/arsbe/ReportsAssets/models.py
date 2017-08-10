# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.forms import *
from django.conf import settings


class ReportAssets(object):
    description = "Show All Current Report Folders and Files"
    report_folders = FilePathField(
        help_text="All report folder",
        path=settings.MEDIA_ROOT,
        recursive=True, allow_folders=True, allow_files=False
    )
    report_files = FilePathField(
        help_text="All report files",
        path=settings.MEDIA_ROOT,
        recursive=True, allow_folders=False, allow_files=True, match="report.html"
    )
    logs_files = FilePathField(
        help_text="All log files",
        path=settings.MEDIA_ROOT,
        recursive=True, allow_folders=False, allow_files=True, match="log.html"
    )
    debug_files = FilePathField(
        help_text="All debugs files",
        path=settings.MEDIA_ROOT,
        recursive=True, allow_folders=False, allow_files=True, match="debug.log"
    )
    screen_shot_files = FilePathField(
        help_text="All screen shot files",
        path=settings.MEDIA_ROOT,
        recursive=True, allow_folders=False, allow_files=True, match=".png"
    )
