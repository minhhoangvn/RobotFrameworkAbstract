__author__ = 'hminh'
import csv
import os
import sys


class FilterBaseWIPFiles(object):
    def __init__(self, supplier_folder_path, base_channel_name, max_duplicate):
        self.base_wip_files_folder_path = supplier_folder_path
        self.channel_name = base_channel_name
        self.count_max_duplicate_allow = max_duplicate

    __base_wip_files_folder_path = None
    __channel_name = None
    __count_max_duplicate_allow = None

    @property
    def count_max_duplicate_allow(self):
        return self.__count_max_duplicate_allow

    @count_max_duplicate_allow.setter
    def count_max_duplicate_allow(self,value):
        if value is None:
            self.__count_max_duplicate_allow = 1
        else:
            self.__count_max_duplicate_allow = int(value)

    @property
    def base_wip_files_folder_path(self):
        return self.__base_wip_files_folder_path

    @base_wip_files_folder_path.setter
    def base_wip_files_folder_path(self, value):
        if os.path.isdir(value):
            self.__base_wip_files_folder_path = value

    @property
    def channel_name(self):
        return self.__channel_name

    @channel_name.setter
    def channel_name(self, channel_name):
        if len(channel_name) == 0:
            raise ValueError("Channel name can not be blank")
        self.__channel_name = channel_name

    channel_line = {}
    lines_data = []
    list_file_path = []
    list_file_duplicate_wip = []

    def get_list_wip_files_path(self):
        for root, directories, files in os.walk(self.base_wip_files_folder_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                self.list_file_path.append(file_path)

    def check_contains_channel(self, channel, line):
        return channel in line[3]

    def parsing_file_name(self, file_path):
        file_path_splitter = str(file_path).split("\\")
        full_file_name = file_path_splitter[len(file_path_splitter) - 1]
        file_name = full_file_name.split(".")[0]
        return file_name

    def filter_wip_files(self):
        self.get_list_wip_files_path()
        self.list_file_path = sorted(self.list_file_path)
        self.__get_list_duplicate_wip_files()
        self.__remove_file()

    def __get_list_duplicate_wip_files(self):
        for file_path in self.list_file_path:
            with open(file_path, 'r') as f:
                reader = csv.reader(f)
                for line in reader:
                    if self.check_contains_channel(self.channel_name, line):
                        if line not in self.lines_data:
                            self.lines_data.append(line)
                            count_duplicate = 0
                        elif self.__check_wip_file_allow_delete(line, count_duplicate):
                            self.list_file_duplicate_wip.append(file_path)
                        else:
                            count_duplicate += 1

    def __remove_file(self):
        self.list_file_duplicate_wip = set(self.list_file_duplicate_wip)
        for file_path in self.list_file_duplicate_wip:
            print file_path
            os.remove(file_path)

    def __check_wip_file_allow_delete(self, line, count_duplicate):
        return line in self.lines_data and count_duplicate > self.count_max_duplicate_allow


if __name__ == "__main__":
    print sys.argv[1]
    print sys.argv[2]
    print sys.argv[3]
    filter_wip_files = FilterBaseWIPFiles(sys.argv[1], sys.argv[2], sys.argv[3])
    filter_wip_files.filter_wip_files()
