import os

from robot.libraries.BuiltIn import BuiltIn
from xlrd import open_workbook


class ExcelUtility(object):
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'
    __instance = None

    @staticmethod
    def get_instance():
        if ExcelUtility.__instance == None:
            ExcelUtility()
        return ExcelUtility.__instance

    def __init__(self):
        self._builtin = BuiltIn()

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = object.__new__(cls)
        return cls.__instance

    # region Read Value Methods In Excel
    '''
    This method return list array of all value in sheet rows
    Examples:
    |Read All Rows Values| C:\\TestData\\DataFile.xlsx | SheetExample | ishaveheader=true
    '''

    def read_all_rows_values(self, file_path, sheet_name, isheader=True):
        workbook = self.__get_excel_file(file_path)
        isheader = bool(isheader)
        sheet = self.__get_excel_sheet(workbook, sheet_name, file_path)
        start_row = self.__is_has_header(isheader)
        max_row = sheet.nrows
        max_column = sheet.ncols
        data = []
        for row in range(start_row, max_row, 1):
            data.append(sheet.row_values(row, 0, max_column))
        return tuple(data)

    '''
    This method return list array of all value in column rows
    Examples:
    TestData.xlsx has sample data in sheet 'SheetExample'
    Column1  Column2 Column3
    A        B       C
    1        2       3
    Row3     Row3    Row3
    |Read All Rows In Column Index| C:\\TestData\\DataFile.xlsx | SheetExample | 2  |  True => ('C','3','Row3')
    |Read All Rows In Column Index| C:\\TestData\\DataFile.xlsx | SheetExample | 2  |  False => ('Column3','C','3','Row3')
    '''

    def read_all_rows_in_column_index(self, file_path, sheet_name, column_index=0, is_has_header=True):
        try:
            index = int(column_index)
            workbook = self.__get_excel_file(file_path)
            start_row = self.__is_has_header(is_has_header)
            sheet_data = self.__get_excel_sheet(workbook, sheet_name, file_path)
            max_row = sheet_data.nrows
            data = sheet_data.col_values(index, start_row, max_row)
            return tuple(data)
        except ValueError as e:
            raise ValueError("Column Index should be integer. [" + str(e.message) + "]")

    def read_cell_value(self, file_path, sheet_name, row_index, column_index):
        if type(column_index) is not int or type(row_index) is not int:
            raise ValueError("Column index and row index should be integer")
        workbook = self.__get_excel_file(file_path)
        sheet_data = self.__get_excel_sheet(workbook, sheet_name, file_path)
        cell_value = sheet_data.cell_value(row_index, column_index)
        return cell_value

    # endregion

    # region Get Status Excel File Methods
    def get_max_row(self, file_path, sheet_name):
        workbook = self.__get_excel_file(file_path)
        sheet_data = self.__get_excel_sheet(workbook, sheet_name, file_path)
        return sheet_data.nrows

    def get_max_column(self, file_path, sheet_name):
        workbook = self.__get_excel_file(file_path)
        sheet_data = self.__get_excel_sheet(workbook, sheet_name, file_path)
        return sheet_data.ncols

    def get_column_index_by_name(self, file_path, sheet_name, column_name, header_row=None):
        workbook = self.__get_excel_file(file_path)
        sheet_data = self.__get_excel_sheet(workbook, sheet_name, file_path)
        max_column = sheet_data.ncols
        first_column = 0
        if header_row is None:
            header_row = 0
        header = sheet_data.row_values(int(header_row), first_column, max_column)
        return header.index(column_name)

    def get_row_index_by_value(self, file_path, sheet_name, row_value, column_index):
        values_in_columns = self.read_all_rows_in_column_index(file_path, sheet_name, column_index, False)
        return values_in_columns.index(row_value)

    # endregion

    # region Private Methods
    def __get_excel_file(self, file_path):
        file_path = str(file_path).replace("\\", "\\\\")
        if os.path.exists(file_path) is False:
            file_dir = self.__get_project_path()
            file_path_with_project_path = file_dir + file_path
            if os.path.exists(file_path_with_project_path) is False:
                raise IOError('Can not find data file in ' + file_path_with_project_path + " or in " + file_path)
            workbook = open_workbook(file_path_with_project_path)
        else:
            workbook = open_workbook(file_path)
        return workbook

    def __get_excel_sheet(self, work_book, sheet_name, file_path):
        sheet_data = work_book.sheet_by_name(sheet_name)
        if (sheet_data.nrows > 1 or sheet_data.ncols > 1) is False:
            raise ValueError('Sheet "' + sheet_name + '" in ' + file_path + ' does not contains values')
        return sheet_data

    # TODO consider solution for config with relative path for data file
    def __get_project_path(self):
        if self._builtin.get_variable_value('${PROJECT_PATH_CMD}') is not None:
            return self._builtin.get_variable_value('${PROJECT_PATH_CMD}')
        if self._builtin.get_variable_value('${PROJECT_PATH}') is None:
            raise ValueError("Missing value for ${PROJECT_PATH} in Config.txt method Instance Global Variable")
        return self._builtin.get_variable_value('${PROJECT_PATH}')

    def __is_has_header(self, is_has_header):
        if bool(is_has_header) is True:
            return 1
        else:
            return 0

    # endregion
    ''''''
