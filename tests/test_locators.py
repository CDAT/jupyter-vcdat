import unittest
import os
import sys
import time

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))
from BaseTestCase import BaseTestCase

# from selenium.webdriver.firefox.options import Options


class TestLocators(BaseTestCase):

    def test_jupyter_top_menu_locators(self):
        '''
            Obtaining all top menu jupyter locators
        '''
        locator = self.main_page

        # Select each element in the top left menu bar
        locator.top_menu_item("File").click()
        locator.top_menu_item("Edit").click()
        locator.top_menu_item("View").click()
        locator.top_menu_item("Run").click()
        locator.top_menu_item("Kernel").click()
        locator.top_menu_item("Tabs").click()
        locator.top_menu_item("Settings").click()
        locator.top_menu_item("Help").click()

    def test_jupyter_left_tab_locators(self):
        '''
            Obtaining all left tab jupyter locators
        '''
        locator = self.main_page

        # Select each left sidebar tab
        locator.left_tab("FileBrowser").click()
        locator.left_tab("Running").click()
        locator.left_tab("Commands").click()
        locator.left_tab("VCDAT").click()
        locator.left_tab("OpenTabs").click()
        locator.left_tab("ExtManager").click()

    def test_launcher_locators(self):
        '''
            Obtaining jupyter launcher locators.
        '''
        locator = self.main_page

        # Select each notebook launcher
        locator.locate_notebook_launcher("Python 3")
        locator.locate_notebook_launcher("Python [conda env:jupyter-vcdat]")

    def test_file_browser_buttons(self):
        '''
            Locate all jupyter tool bar icons
        '''
        locator = self.main_page
        locator.new_launcher_icon()
        locator.new_folder_icon()
        locator.upload_files_icon()
        locator.refresh_file_list_icon()

    def test_new_notebook(self):
        '''
            Test new notebook
        '''
        print("\n\n...{}...".format(self._testMethodName))
        notebook_name = "{}.ipynb".format(self._testMethodName)
        # notebook = NoteBookPage(self.driver, None)
        notebook = self.new_notebook("Python 3", notebook_name)
        time.sleep(5)
        self.save_close_notebook(notebook)
        self.main_page.shutdown_kernel()
        os.remove(notebook_name)

    def test_vcdat_panel_locators(self):
        '''
            Test vcdat panel locators
        '''
        print("\n\n...test_vcdat_panel_locators...")
        main_page = self.main_page
        vcdat_panel = main_page.click_on_vcdat_icon()
        vcdat_panel.locate_plot()
        vcdat_panel.locate_export_plot()
        vcdat_panel.locate_clear()
        vcdat_panel.locate_load_variables_by_file()
        vcdat_panel.locate_load_variables_by_path()
        vcdat_panel.locate_select_plot_type()
        vcdat_panel.locate_select_colormap()
        vcdat_panel.locate_select_a_template()

    def test_file_browser_locators(self):
        '''
            Test file browser locators
        '''
        print("\n\n...test_file_browser_locators...")
        main_page = self.main_page
        main_page.click_on_folder_tab()
        main_page.home_icon().click()

    def ABCtest_all_locators(self):
        '''
            Run test to check all locators are available.
        '''
        self.test_jupyter_top_menu_locators()
        self.test_jupyter_left_tab_locators()
        self.test_launcher_locators()
        self.test_file_browser_buttons()


if __name__ == '__main__':
    unittest.main(verbosity=2)

# nosetests -s tests/test_locators.py:TestLocators.test_new_notebook
# nosetests -s tests/test_locators.py:TestLocators.test_file_browser_locators
