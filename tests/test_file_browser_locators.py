import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from BaseTestCase import BaseTestCase
from VcdatPanel import VcdatPanel


class TestFileBrowserLocators(BaseTestCase):
    def test_double_click_on_a_file(self):
        print("\n\n...test_load_a_file...")
        self.main_page.click_on_folder_tab()
        self.main_page.click_on_vcdat_icon()

        vcdat_panel = VcdatPanel(self.driver, None)

        file_browser = vcdat_panel.click_on_load_variables_by_file()
        file_browser.double_click_on_a_file("clt.nc")

# nosetests -s tests/test_file_browser_locators.py:TestFileBrowserLocators.test_double_click_on_a_file
