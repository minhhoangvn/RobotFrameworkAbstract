__author__ = 'hminh'

import os
import platform
import re
import shutil
import subprocess
import time
import zipfile
from time import sleep


class SystemHelper(object):
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'
    __instance = None

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = object.__new__(cls)
        return cls.__instance

    # region Command Line Helper
    '''
    Command line Ex:
    Execute Command Line  |  ipconfig => execute ipconfig command
    '''

    def execute_command_line(self, command):
        process = subprocess.Popen(command, stderr=subprocess.PIPE)
        self.__check_run_command_line_successfully(process.stderr.read())

    '''
    Copy all file by execute coomand line via python
    Note: add \ char for special chars Ex: \t, \v, \
    '''

    def copy_all_file_in_folder_by_cmd(self, source_path, destination_path):
        self.execute_command_line(self.__generate_copy_command(source_path, destination_path))

    # endregion

    # region File/Folder helper with shutil API
    '''
    Copy files on folder base on start index of file
    Ex: Folder A has list files A1,A2,A3,A4,A5,A6 and path folder is temp/A
    destination path dst/A
    Copy Files With File Index temp/A  |  dst/A  |  2  => copy files A4,A5,A6 in folder A
    Copy Files With File Index temp/A  |  dst/A  |  2  |  1  => copy files A4 in folder A
    '''

    def copy_files_from_file_index(self, source_path, destination_path, start_index, total_files_copy=None):
        list_files_path = self.get_list_files_path_in_folder(source_path)
        total_files_in_folder = len(list_files_path)
        self.__check_conditions_before_copy_or_move_files(str(source_path), start_index, total_files_in_folder,
                                                          total_files_copy)
        self.__copy_files_in_folder(list_files_path, str(destination_path), start_index,
                                    total_files_copy)

    def move_file_from_file_index(self, source_path, destination_path, start_index, total_files_copy=None):
        list_files_path = self.get_list_files_path_in_folder(str(source_path))
        total_files_in_folder = len(list_files_path)
        self.__check_conditions_before_copy_or_move_files(str(source_path), start_index, total_files_in_folder,
                                                          total_files_copy)
        self.__move_files_in_folder(list_files_path, str(destination_path), start_index,
                                    total_files_copy)

    def get_file_path_by_file_name(self, base_folder, file_name):
        if os.path.isdir(base_folder) is False:
            raise ValueError("Base Folder for searching is invalid [" + str(base_folder) + "]")
        file_path = self.__search_path_by_file_name(base_folder, file_name)
        return file_path

    def get_folder_path_by_folder_name(self, base_folder, folder_name):
        if os.path.isdir(base_folder) is False:
            raise ValueError("Base Folder for searching is invalid [" + str(base_folder) + "]")
        folder_path = self.__search_path_by_folder_name(base_folder, folder_name)
        return folder_path

    def zip_multiple_files(self, zip_file_path, folder_path):
        with zipfile.ZipFile(zip_file_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            list_file_name = self.get_list_files_path_in_folder(folder_path)
            for f in list_file_name:
                zip_file.write(f)

    # endregion

    # region File/Folder get status helper
    '''
    Create new folder if it not exist
    '''

    def create_new_folder(self, folder_path):
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

    def check_file_exist(self, file_path):
        return os.path.isfile(file_path)

    def check_folder_exist(self, folder_path):
        try:
            return os.path.isdir(folder_path)
        except TypeError:
            raise ValueError(
                'Folder Path[' + folder_path + '] is invalid, it contains special char, please re-check and added "\\" before it')

    def rename_file(self, old_file_name, new_file_name):
        os.rename(old_file_name, new_file_name)

    def delete_file(self, path):
        os.remove(path)

    '''
    Return enumerable files path
    Ex:  C:/Temp/ folder contains file A.txt, B.txt, C.xlsx
    Get All Files Path In Folder  |  C://temp => (C:/Temp/A.txt,C:/Temp/B.txt,C:/Temp/C.xlsx)
    '''

    def get_list_files_path_in_folder(self, source_path):
        total_files_path = ()
        list_files_name = self.get_list_files_name_in_folder(source_path)
        if len(list_files_name) > 0:
            get_list_file_path = lambda file_name: str(
                source_path) + os.path.sep + file_name
            total_files_path = tuple(map(get_list_file_path, list_files_name))
        return total_files_path

    '''
    Return enumerable files name
    Ex:  C:/Temp/ folder contains file A.txt, B.txt, C.xlsx
    Get All Files Name In Folder  |  C://temp => (A,B,C)
    '''

    def get_list_files_name_in_folder(self, folder_path):
        if self.check_folder_exist(folder_path) is False:
            raise ValueError("Source Folder is invalid. Folder Path [" + str(folder_path) + "] is invalid folder path")
        list_files_name = tuple(os.listdir(folder_path))
        return list_files_name

    # endregion

    # region Delay Method

    def explicit_wait(self, func, time_out, polling_time='500ms', *args):
        self.__check_valid_time_out_value(time_out)
        is_exist = False
        convert_to_ms = 1000
        max_time_out, polling_time_out = self.__time_value_for_running_explicit_wait(time_out, polling_time)
        while is_exist is False and (time.time() * convert_to_ms) < max_time_out:
            try:
                is_exist = func(*args)
                is_exist = is_exist or is_exist is None
                time.sleep(polling_time_out)
            except Exception as e:
                raise ValueError("Function error with " + str(e.message))
        if is_exist is False:
            raise RuntimeError("Time out after waiting in " + str(time_out))

    def wait_in_millisecond(self, time_out):
        sleep(int(time_out) * 0.1)

    # endregion

    # region Private method

    # region CMD method
    def __get_current_platform(self):
        return platform.system()

    def __generate_copy_command(self, source_path, destination_path):
        current_os = (self.__get_current_platform()).upper()
        if current_os == "WINDOWS":
            return (self.__copy_all_files_win_command()).format(source_path, destination_path)

    def __copy_all_files_win_command(self):
        return 'XCOPY "{0}" "{1}" /S /E /Y'

    # endregion

    # region Shutil Private Methods

    def __copy_files_in_folder(self, list_files, destiantion_path, start_index, total_files_copy=None):
        self.create_new_folder(destiantion_path)
        total_files_copy = self.__calculate_total_files_copy(list_files, start_index, total_files_copy)
        for file_name in range(start_index, total_files_copy, 1):
            shutil.copy(str(list_files[file_name]), str(destiantion_path))

    def __move_files_in_folder(self, list_files, destiantion_path, start_index, total_files_copy=None):
        self.create_new_folder(destiantion_path)
        total_files_copy = self.__calculate_total_files_copy(list_files, start_index, total_files_copy)
        for file_name in range(start_index, total_files_copy, 1):
            shutil.move(str(list_files[file_name]), str(destiantion_path))

    def __calculate_total_files_copy(self, list_files, start_index, total_files_copy):
        if total_files_copy is None:
            total_files_copy = len(list_files)
        else:
            total_files_copy = start_index + total_files_copy
        return total_files_copy

    def __check_run_command_line_successfully(self, error_msg):
        if 'Exception' in error_msg or 'Error' in error_msg:
            raise ValueError("Execute command line has error: " + error_msg)

    def __check_conditions_before_copy_or_move_files(self, source_path, start_index, total_files_in_folder,
                                                     total_files_copy):
        if total_files_in_folder == 0:
            raise ValueError("Cannot copy with empty folder in path " + str(source_path))
        if start_index > total_files_in_folder:
            raise ValueError("Total files in folder is " + str(
                total_files_in_folder) + ". Start index for copy is out of range for total folder file.")
        if total_files_copy > total_files_in_folder:
            raise ValueError("Total files in folder is " + str(
                total_files_in_folder) + ". Number of copy files is greater than current files in folder.")
        if type(start_index) is not int:
            raise ValueError('Parameter for start index should be int')
        if self.check_folder_exist(source_path) is False:
            raise ValueError("Can not copy file with invalid folder : " + source_path)

    # endregion

    # region Get Path File Helper

    def __search_path_by_file_name(self, base_folder, file_name):
        for root, dirs, list_file_name in os.walk(base_folder, topdown=True):
            if file_name in list_file_name:
                file_path = root + os.path.sep + list_file_name[list_file_name.index(file_name)]
                break
        else:
            raise ValueError("Can not find path for file " + str(file_name))
        return file_path

    def __search_path_by_folder_name(self, base_folder, folder_name):
        for root, list_dirs, list_file_name in os.walk(base_folder, topdown=True):
            if folder_name in list_dirs:
                folder_path = root + os.path.sep + list_dirs[list_dirs.index(folder_name)]
                break
        else:
            raise ValueError("Can not find path for file " + str(folder_name))
        return folder_path

    # endregion

    # region Explicit Wait Method

    def __check_valid_time_out_value(self, time_out):
        if type(time_out) is not str:
            raise ValueError("Time out is not valid, please input with valid format")

    def __time_value_for_running_explicit_wait(self, time_out, polling_time):
        convert_to_ms = 1000
        time_out_mode = self.__get_time_out_mode(time_out)
        time_out_value = self.__get_time_out_value(time_out)
        polling_time_mode = self.__get_time_out_mode(polling_time)
        polling_value = self.__get_time_out_value(polling_time)
        max_time_out = (time.time() * convert_to_ms) + (time_out_value * time_out_mode)
        polling_time_out = (polling_value * polling_time_mode) * (1.0 / convert_to_ms)
        return (max_time_out, polling_time_out)

    def __get_time_out_mode(self, time_out):
        valid_time_mode = ('ms', 's', 'm', 'h')
        regex = re.compile(r"[a-z]+")
        time_mode = regex.findall(time_out)[0]
        if time_mode not in valid_time_mode:
            raise ValueError(
                "Time mode is invalid, please input value in list " + str(time_mode) + ", Ex: time_out = '300ms'")
        if time_mode == 'ms':
            time_mode_convert = 1
        elif time_mode == 's':
            time_mode_convert = 1000
        elif time_mode == 'm':
            time_mode_convert = 60 * 1000
        else:
            time_mode_convert = 60 * 60 * 1000
        return int(time_mode_convert)

    def __get_time_out_value(self, time_out):
        regex = re.compile(r"[0-9]+")
        time_out_value = int(regex.findall(time_out)[0])
        return time_out_value

    # endregion

    # endregion
    '''
    '''
