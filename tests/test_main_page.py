from BaseTestCase import BaseTestCase
from FileBrowser import FileBrowser
import sys
import os
this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

# To run these tests: npx task test -c test_main_page


class TestMainPage(BaseTestCase):

    def test_create_notebook(self):
        # Ensure the home directory working directory
        file_browser = FileBrowser(self.driver, None)
        file_browser.folder_icon().click()

        # Create the notebook
        NOTEBOOK = "test_create_notebook"
        self.main_page.create_notebook(NOTEBOOK)
        self.main_page.remove_notebook(NOTEBOOK)

    def test_left_tab(self):
        # Click on each left tab
        for tab in self.main_page.LEFT_TABS:
            self.main_page.left_tab(tab).click()

    def test_sub_menu(self):
        # Click a few items within each top menu and sub menus
        self.main_page.top_menu_item("File", "New Launcher").click()
        self.main_page.top_menu_item("File", "Close All Tabs").click()
        self.main_page.sub_menu_item(
            "Settings", "JupyterLab Theme", "JupyterLab Dark").click()
        self.main_page.sub_menu_item(
            "Settings", "JupyterLab Theme", "JupyterLab Light").click()
        self.main_page.top_menu_item("Help", "VCS Basic Tutorial").click()

    def test_top_menu(self):
        # Click on each top menu
        for menu in self.main_page.TOP_MENUS:
            self.main_page.top_menu(menu).click()

    def test_tutorials(self):
        JUPYTER_LAB_TOUR_STEPS = 4
        VCDAT_TOUR_STEPS = 13

        # Test the Jupyter Lab Tour
        self.main_page.tutorial_start("Jupyterlab Tutorial: Intro")

        for step in range(1, JUPYTER_LAB_TOUR_STEPS+1):
            try:
                self.main_page.tutorial_next().click().wait(1)
            except Exception:
                print("Error after tutorial step: {}".format(step))

        # Test the VCDAT Intro Tour
        self.main_page.open_left_tab("VCDAT")
        self.main_page.tutorial_start("VCDAT Tutorial: Introduction")

        for step in range(1, VCDAT_TOUR_STEPS+1):
            try:
                self.main_page.tutorial_next().click().wait(1)
            except Exception:
                print("Error after tutorial step: {}".format(step))
