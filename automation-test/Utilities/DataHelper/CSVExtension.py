__author__ = 'hminh'
import csv,codecs,cStringIO
from robot.libraries.BuiltIn import BuiltIn

class CSVUtility(object):
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'
    __instance = None

    @staticmethod
    def get_instance():
        if CSVUtility.__instance == None:
            CSVUtility()
        return CSVUtility.__instance

    def __init__(self):
        self._builtin = BuiltIn()

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = object.__new__(cls)
        return cls.__instance

    def create_csv_file(self, file_path, data, header_name = None):
            with open(file_path,'wb') as csv_file:
                writer =csv.writer(csv_file)
                if header_name is not None:
                    writer.writerow(header_name)
                if type(data) is list or type(data) is tuple:
                    for row in data:
                        writer.writerow(row)
                else:
                    writer.writerow([data])