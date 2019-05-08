import unittest
import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from MainPageLocator import MainPageLocator
from LocatorBaseTestCase import LocatorBaseTestCase

# from selenium.webdriver.firefox.options import Options


class TestLocators(LocatorBaseTestCase):

    def test_jupyter_top_menu_locators(self):
        '''
            Obtaining all top menu jupyter locators
        '''
        print("\n\n...test_jupyter_top_menu_locators...")
        locator = self.main_page

        # Select each element in the top left menu bar
        locator.select_top_menu_item("File")
        locator.select_top_menu_item("Edit")
        locator.select_top_menu_item("View")
        locator.select_top_menu_item("Run")
        locator.select_top_menu_item("Kernel")
        locator.select_top_menu_item("Tabs")
        locator.select_top_menu_item("Settings")
        locator.select_top_menu_item("Help")

    def test_jupyter_left_tab_locators(self):
        '''
            Obtaining all left tab jupyter locators
        '''
        print("\n\n...test_jupyter_left_tab_locators...")
        locator = self.main_page

        # Select each left sidebar tab
        locator.select_file_tab()
        locator.select_running_tab()
        locator.select_command_palette_tab()
        locator.select_vcdat_icon()
        locator.select_open_tabs_tab()

    def test_launcher_locators(self):
        '''
            Obtaining jupyter launcher locators.
        '''
        print("\n\n...test_launcher_locators...")
        locator = MainPageLocator(self.driver, self.server)

        # Select each notebook launcher
        locator.select_notebook_launcher("Python 3")
        locator.select_notebook_launcher("Python [conda env:jupyter-vcdat] *")

    def test_open_widgets(self):
        print("\n\n...test_open_widgets...")
        # locator = MainPageLocator(self.driver, self.server)
        locator = self.main_page

        locator.click_on_jp_folder_icon()
        locator.click_on_jp_direction_run_icon()
        locator.click_on_jp_pallette_icon()
        locator.click_on_vcdat_icon()
        locator.click_on_jp_tab_icon()

    def test_jp_tool_bar(self):
        '''
           locate all jupyter tool bar icons
        '''
        locator = self.main_page

        locator.select_jp_tool_bar_icon("New Launcher")
        locator.select_jp_tool_bar_icon("New Folder")
        locator.select_jp_tool_bar_icon("Upload Files")
        locator.select_jp_tool_bar_icon("Refresh File List")

    def ABCtest_new_notebook(self):

        print("\n\n...{}...".format(self._testMethodName))
        locator = self.main_page
        print(".. attempting to click top item...")
        # locator.click_top_menu_submenu("File", "New")
        # locator.click_top_menu_submenu_submenu("File", "New", "Notebook")
        locator.click_top_menu_item("File")
        locator.click_on_submenu("New")
        locator.click_on_submenu_with_data_command("notebook:create-new", "Notebook")
        locator.click_on_select_kernel()

    def test_all_locators(self):
        '''
        Run test to check all locators are available.
        '''
        self.test_jupyter_top_menu_locators()
        self.test_jupyter_left_tab_locators()
        self.test_launcher_locators()
        self.test_open_widgets()


if __name__ == '__main__':
    unittest.main(verbosity=2)

# nosetests -s tests/test_locators.py:TestLocators.test_all_locators
