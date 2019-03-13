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
from selenium.common.exceptions import NoSuchElementException


class BrowserTest(BaseTestCase):

    def test_plot_variable1(self):
        print("xxx test_vcdat_jupyter_lab xxx")
        utils = JupyterUtils()
        server = utils.get_server()

        main_page = MainPage(self.driver, server)

        try:
            note_book = NoteBookPage(self.driver, None)
            note_book.close()
            time.sleep(5)
        except NoSuchElementException:
            print("No notebook opened")
            pass

        left_side_bar = VcdatLeftSideBar(self.driver, None)
        left_side_bar.click_on_jp_vcdat_icon()
        time.sleep(5)
        left_side_bar.click_on_load_variables()

        file_browser = FileBrowser(self.driver, None)
        file_browser.double_click_on_a_file("clt.nc")
        time.sleep(5)

        load_variable_pop_up = LoadVariablePopUp(self.driver)
        load_variable_pop_up.click_on_var('clt')
        load_variable_pop_up.click_on_var('u')
        load_variable_pop_up.click_on_var('v')
        load_variable_pop_up.load()



        #main_page.load_file("clt.nc")

        # validate that we get a notebook
        #nb_page = NoteBookPage(self.driver, server)
        #nb_page.enter_code("s=data('clt')")
        #nb_page.enter_code("x.plot(s)")

if __name__ == '__main__':
    unittest.main(verbosity=2)
