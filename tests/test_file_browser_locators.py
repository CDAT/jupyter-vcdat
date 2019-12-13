import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from FileBrowser import FileBrowser
from BaseTestCase import BaseTestCase


class TestFileBrowserLocators(BaseTestCase):
    def test_double_click_on_a_file(self):
        print("\n\n...test_load_a_file...")
        self.main_page.click_on_folder_tab()
        self.main_page.click_on_home_icon()

        file_browser = FileBrowser(self.driver, None)
        file_browser.double_click_on_a_file("clt.nc")

# nosetests -s tests/test_file_browser_locators.py:TestFileBrowserLocators.test_double_click_on_a_file
