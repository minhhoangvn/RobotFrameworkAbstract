__author__ = 'hminh'
import xml.etree.ElementTree as ET
from xml.etree.ElementTree import ParseError


class XMLHelper(object):
    ROBOT_LIBRARY_SCOPE = 'TEST SUITE'

    def __init__(self, xml_file_path=None):
        self.__tree = None
        if xml_file_path is not None:
            self.init_xml_tree(xml_file_path)

    def init_xml_tree(self, xml_file_path):
        try:
            tree = ET.parse(xml_file_path)
            self.__tree = tree.getroot()
        except ParseError:
            raise ParseError("File " + xml_file_path + " is not valid in XML format")
        except IOError:
            raise ValueError("XML File Path is invalid, can not find file in path " + xml_file_path)
        except ValueError:
            xmlp = ET.XMLParser(encoding="utf-8")
            tree = ET.parse(xml_file_path, parser=xmlp)
            self.__tree = tree.getroot()

    def get_child_element(self, element_path):
        self.__check_exist_tree_element()
        return self.__tree.find(element_path)

    def get_child_elements(self, element_path):
        self.__check_exist_tree_element()
        return self.__tree.findall(element_path)

    def get_element_value(self, element):
        if element.getchildren() == []:
            return element.text
        else:
            raise ValueError("Please call get_list_elements_value method")

    def get_list_elements_value(self, list_elements):
        list_value = {}
        for child in list_elements:
            if child.getchildren() == []:
                list_value[child.tag] = child.text
            else:
                list_value.update(self.get_list_elements_value(child))
        return list_value

    def __check_exist_tree_element(self):
        if self.__tree is None:
            raise ValueError("Please call init_xml_tree function for init xml tree")
