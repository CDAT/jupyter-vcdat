import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))
from BaseTestCase import BaseTestCase


class TestMainPageLocators(BaseTestCase):
    def test_top_menu_items(self):

        # Clicking all over menus, without worrying that the order is correct and a parent drop-down was clicked first.
        self.main_page.top_menu_item("File").click()
        self.main_page.left_tab("Running").click()
        self.main_page.sub_menu_item(
            "Edit", "Cut Cells", "Edit -> Cut Cells").click()
        self.main_page.top_menu_item("Tabs").click()
        self.main_page.sub_menu_item(
            "File", "Export File As", "File -> Export File As").click()
        self.main_page.open_left_tab("VCDAT")
        self.main_page.home_icon().click()

        # Example to test vcdat tutorial
        self.main_page.tutorial_next().click()
        self.main_page.tutorial_next().click()
        self.main_page.tutorial_skip().click()

# npx task test -c test_mainpage_locators
