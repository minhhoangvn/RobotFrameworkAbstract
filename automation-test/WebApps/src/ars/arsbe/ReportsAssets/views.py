# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from rest_framework.views import APIView
from django.views.generic import View
from rest_framework.renderers import JSONRenderer
from .models import ReportAssets
from rest_framework.response import Response
from django.shortcuts import render


class ReportAssetList(APIView):
    renderer_classes = (JSONRenderer,)

    def get(self, request, format=None, *args, **kwargs):
        form_reports_assets = ReportAssets()
        json_object = {
            "report_folders": form_reports_assets.report_folders.choices,
            "report_files": form_reports_assets.report_files.choices,
            "logs_files": form_reports_assets.logs_files.choices,
            "debug_files": form_reports_assets.debug_files.choices,
            "report_images": form_reports_assets.screen_shot_files.choices.sort()
        }
        return Response(json_object)


class ReportAssetsReportFile(View):
    def get(self, request, format=None,*args, **kwargs):
        print(args)
        data_append = {}
        xml_data = None
        import os
        for root, dirs, files in os.walk("C:\Automation\Test Report\WIP_Report\WIP_Regressions_20170517_223651"):
            for name in files:
                if 'js' in name:
                    with open(os.path.join(root, name), 'r') as f:
                        data_append[name] = f.read()
                if '.xml' in name:
                    with open(os.path.join(root, name), 'r') as f:
                        xml_data = f.read()
        with open(r"C:\Automation\Test Report\WIP_Report\WIP_Regressions_20170517_223651\log.html", "r") as report_file:
            source_string = report_file.read()
        return render(request, "ars/reportindex.html", {"report": source_string, "js": data_append, 'xml': xml_data})
