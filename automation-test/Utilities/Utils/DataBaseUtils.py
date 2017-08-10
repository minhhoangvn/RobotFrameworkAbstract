__author__ = 'hminh'
from DatabaseLibrary import DatabaseLibrary
from .SystemUtils import SystemHelper
from robot.libraries.BuiltIn import BuiltIn


class DataBaseHelper(object):
    ROBOT_LIBRARY_SCOPE = 'TEST SUITE'
    DB_TYPE = ["MySQLdb", "pymysql", "psycopg2", "cx_Oracle"]

    # TODO Reduce number of paramater in DatabaseHelper Contructor, passing TestRunner Class for get all DB config
    def __init__(self, db_name, db_port, sql_source_scripts_path=None, user="apps", password="apps",
                 db_host="db.sc.esilicon.com",
                 db_type="cx_Oracle"):
        self.__is_valid_database_type(db_type)
        self._builtin = BuiltIn()
        self._database_library = DatabaseLibrary()
        self._system_helper = SystemHelper()
        self.__connection_data_base(db_type, db_name, db_host, db_port, user, password)
        self._sql_source_scripts_path = sql_source_scripts_path

    # region Stored Procedure Action
    def execute_query(self, query_string_src, query_mode='SQL_STRING'):
        if query_mode.upper() == 'FILE':
            self._database_library.execute_sql_string(self.__get_sql_source_string(query_string_src))
        else:
            self._database_library.execute_sql_string(query_string_src)

    def execute_query_with_parameter(self, query_string_src, query_mode='SQL_STRING', *param):
        if query_mode.upper() == 'FILE':
            query_string = self.__get_sql_source_string(query_string_src)
            query_string = self.__passing_parameter_to_sql_query_string(query_string, *param)
            print query_string
            self._database_library.execute_sql_string(query_string)
        else:
            self._database_library.execute_sql_string(query_string_src)

    def check_stored_procedure_exist(self, sp_name):
        if sp_name is None:
            raise ValueError("Stored procedure is null")
        sp_name = str(sp_name).upper()
        query = "SELECT * FROM USER_OBJECTS WHERE object_type = 'PROCEDURE' AND object_name ='" + sp_name + "'"
        result = self._database_library.query(query)
        stored_exist = len(result) > 0
        return stored_exist

    # endregion
    # region Query Action Utils
    def get_query_result(self, query_string):
        try:
            result = self._database_library.query(query_string)
            return_result = result
            if len(result) == 0:
                return_result = []
            if len(result) == 1:
                if len(result[0]) == 1:
                    return_result = result[0][0]
                else:
                    return_result = tuple(result[0])
            return return_result
        except Exception as e:
            raise SyntaxError("Has Error in query result, Please check query statement, " + str(e.message))

    # endregion
    # region Connection Action
    def get_database_connection(self):
        if self._database_library == None:
            raise ValueError("Database Connection is close, please open new connection")
        return self._database_library

    def close_connection(self):
        self._database_library.disconnect_from_database()
        self._database_library = None

    # endregion
    def __is_valid_database_type(self, database_type):
        is_valid = database_type in self.DB_TYPE
        if is_valid is not True:
            raise ValueError("Using list of DataBase Type below: " + str(self.DB_TYPE))

    def __connection_data_base(self, db_type, db_name, db_host, db_port, db_user, db_password):
        if db_type in ["MySQLdb", "pymysql", "psycopg2"]:
            self._database_library.connect_to_database(db_name, db_user,
                                                       db_password, db_host,
                                                       db_port)
        elif db_type == 'cx_Oracle':
            connection_string = "user='{}', password='{}',dsn='(DESCRIPTION=(ADDRESS = (PROTOCOL = TCP)(HOST = {})" \
                                "(PORT = {}))(CONNECT_DATA = (SERVICE_NAME = {})))'"
            connection_string = connection_string.format(db_user, db_password,
                                                         db_name + db_host, db_port,
                                                         db_name)
            self._database_library.connect_to_database_using_custom_params("cx_Oracle",
                                                                           connection_string)

    def __passing_parameter_to_sql_query_string(self, query_string, *param):
        try:
            query_string = str(query_string).format(*param)
            return query_string
        except IndexError:
            raise ValueError("Parameter passing is not enought for query string parameter")

    def __get_sql_source_string(self, file_name):

        file_name = self.__get_sql_file_name(file_name)
        sql_script_file_path = self.__get_sql_folder_path() + "\\" + file_name + "sql"
        is_file_exist = self._system_helper.check_file_exist(sql_script_file_path)
        if is_file_exist is True:
            sql_script_file = open(sql_script_file_path)
            sql_source_string = sql_script_file.read()
            query_statement = sql_source_string.replace('\n', ' ')
            sql_script_file.close()
            return query_statement
        else:
            raise ValueError("File " + file_name + "sql is not exist in " + sql_script_file_path)

    def __get_sql_file_name(self, file_name):
        if '.' in file_name:
            file_name_split = str(file_name).split('.')
            return_file_name = ''
            for count in range(0, len(file_name_split) - 1, 1):
                return_file_name = return_file_name + file_name_split[count] + '.'
            return return_file_name
        else:
            return file_name + '.';

    def __get_sql_folder_path(self):
        if self._sql_source_scripts_path is not None:
            return self._sql_source_scripts_path
        if self._builtin.get_variable_value('${SQL_SCRIPTS_FOLDER_CMD}') is not None:
            return self._builtin.get_variable_value('${SQL_SCRIPTS_FOLDER_CMD}')
        if self._builtin.get_variable_value('${SQL_SCRIPTS_FOLDER}') is None:
            raise ValueError("Missing value for ${SQL_SCRIPTS_FOLDER} in Config.txt method Instance Global Variable")
        return self._builtin.get_variable_value('${SQL_SCRIPTS_FOLDER}')
