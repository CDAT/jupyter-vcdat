import unittest
import os
import sys
import time

this_dir = os.path.abspath(os.path.dirname(__file__))
lib_dir = os.path.join(this_dir, 'lib')
sys.path.append(lib_dir)

from BaseTestCase import BaseTestCase
from BasePage import InvalidPageException
from VcdatLeftSideBar import VcdatLeftSideBar
from FileBrowser import FileBrowser
from MainPage import MainPage
from NoteBookPage import NoteBookPage
from JupyterUtils import JupyterUtils
from LoadVariablePopUp import LoadVariablePopUp
from PlotArea import PlotArea
from selenium.common.exceptions import NoSuchElementException

class BrowserBaseTest(BaseTestCase):

    #@classmethod
    #def setup_class(self):
    #    print("...setup_class...")
    #    utils = JupyterUtils()
    #    self.server = utils.get_server()
    #    self.main_page = MainPage(self.driver, self.server)
    #    self.close_notebook_if_any(self)

    def close_notebook_if_any(self):

        try:
            note_book = NoteBookPage(self.driver)
            note_book.close()
            time.sleep(5)
        except NoSuchElementException:
            print("No notebook opened")
            pass

    def load_data_file(self, filename):
        left_side_bar = VcdatLeftSideBar(self.driver, None)
        left_side_bar.click_on_jp_vcdat_icon()
        time.sleep(5)
        left_side_bar.click_on_load_variables()

        file_browser = FileBrowser(self.driver, None)
        file_browser.double_click_on_a_file(filename)
        time.sleep(5)

        return left_side_bar
