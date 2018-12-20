import unittest
import os 
import sys
import time

this_dir = os.path.abspath(os.path.dirname(__file__))
lib_dir = os.path.join(this_dir, 'lib')
sys.path.append(lib_dir)

#print("xxx xxx lib_dir: {d}".format(d=lib_dir))

# from BaseTestCase import BaseTestCase
from BaseTestCase import BaseTestCase
from BasePage import InvalidPageException
from MainPage import MainPage
from Tab import ConsoleTab
from JupyterUtils import JupyterUtils

class BrowserTest(BaseTestCase):
    def ABCtest_basic(self):
        print("xxx test_vcdat_jupyter_lab xxx")
        utils = JupyterUtils()
        server = utils.get_server()

        ##ws = "http://localhost:8888/?token=4a25c7eb4ac7042da403eecbac6691a51132543b95b4e613"
        #ws = "http://www.google.com"
        #ws = "http://localhost:8888"
        main_page = MainPage(self.driver, server)

        #main_page.load_file("clt.nc")

        # validate what is displayed in the console
        #console = ConsoleTab(self.driver, 'Console 1')

    def test_load_variable1(self):
        print("xxx test_vcdat_jupyter_lab xxx")
        utils = JupyterUtils()
        server = utils.get_server()

        ##ws = "http://localhost:8888/?token=4a25c7eb4ac7042da403eecbac6691a51132543b95b4e613"
        #ws = "http://www.google.com"
        #ws = "http://localhost:8888"
        main_page = MainPage(self.driver, server)

        main_page.load_file("clt.nc")

        # validate what is displayed in the console
        #console = ConsoleTab(self.driver, 'Console 1')

if __name__ == '__main__':
    unittest.main(verbosity=2)
