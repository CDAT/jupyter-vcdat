import unittest
import os
import sys
import time

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from MainPageLocator import MainPageLocator
from BaseTestCase import BaseTestCase

# from selenium.webdriver.firefox.options import Options


class TestLocators(BaseTestCase):

    def test_jupyter_top_menu_locators(self):
        '''
            Obtaining all top menu jupyter locators
        '''
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
        locator = self.main_page

        # Select each left sidebar tab
        locator.select_folder_tab()
        locator.select_running_tab()
        locator.select_command_palette_tab()
        locator.select_vcdat_icon()
        locator.select_open_tabs_tab()

    def test_launcher_locators(self):
        '''
            Obtaining jupyter launcher locators.
        '''
        locator = MainPageLocator(self.driver, self.server)

        # Select each notebook launcher
        locator.select_notebook_launcher("Python 3")
        locator.select_notebook_launcher("Python [conda env:jupyter-vcdat] *")

    def test_open_widgets(self):
        # locator = MainPageLocator(self.driver, self.server)
        locator = self.main_page
        locator.click_on_folder_tab()
        locator.click_on_running_tab()
        locator.click_on_command_palette_tab()
        locator.click_on_vcdat_icon()
        locator.click_on_open_tabs_tab()

    def test_jp_tool_bar(self):
        '''
           locate all jupyter tool bar icons
        '''
        locator = self.main_page

        locator.select_new_launcher_icon()
        locator.select_new_folder_icon()
        locator.select_upload_files_icon()
        locator.select_refresh_file_list_icon()

    def test_new_notebook(self):
        print("\n\n...{}...".format(self._testMethodName))
        notebook_name = "{}.ipynb".format(self._testMethodName)
        # notebook = NoteBookPage(self.driver, None)
        notebook = self.new_notebook("Python [conda env:jupyter-vcdat] *", notebook_name)
        time.sleep(5)
        self.save_close_notebook(notebook)
        self.main_page.shutdown_kernel()
        os.remove(notebook_name)

    def test_vcdat_panel_locators(self):
        print("\n\n...test_vcdat_panel_locators...")
        main_page = self.main_page
        vcdat_panel = main_page.click_on_vcdat_icon()
        vcdat_panel.select_plot()
        vcdat_panel.select_export_plot()
        vcdat_panel.select_clear()
        vcdat_panel.select_load_variables()
        vcdat_panel.select_select_plot_type()
        vcdat_panel.select_select_a_template()

    def test_file_browser_locators(self):
        print("\n\n...test_file_browser_locators...")
        main_page = self.main_page
        main_page.click_on_folder_tab()
        main_page.click_on_home_icon()

    def ABCtest_all_locators(self):
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
