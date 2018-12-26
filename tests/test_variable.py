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
from NoteBookPage import NoteBookPage
from JupyterUtils import JupyterUtils

class BrowserTest(BaseTestCase):

    def test_load_variable1(self):
        print("xxx test_vcdat_jupyter_lab xxx")
        utils = JupyterUtils()
        server = utils.get_server()

        ##ws = "http://localhost:8888/?token=4a25c7eb4ac7042da403eecbac6691a51132543b95b4e613"
        #ws = "http://www.google.com"
        #ws = "http://localhost:8888"
        main_page = MainPage(self.driver, server)

        main_page.load_file("clt.nc")

        # validate that we get a notebook
        nb_page = NoteBookPage(self.driver, server)
        nb_page.enter_code("s=data('clt')")
        nb_page.enter_code("x.plot(s)")

if __name__ == '__main__':
    unittest.main(verbosity=2)
