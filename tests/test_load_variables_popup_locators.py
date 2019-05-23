import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from VcdatPanel import VcdatPanel
from BaseTestCaseWithNoteBook import BaseTestCaseWithNoteBook


class TestLoadVariablesPopUpLocators(BaseTestCaseWithNoteBook):

    def test_click_a_variable(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')

    def test_click_a_variable_axes(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_variable_axes('v')

    def test_adjust_a_variable_axes(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_variable_axes('v')
        load_variable_popup.adjust_var_axes_slider('v', 'latitude2', 10, -10)


# nosetests -s tests/test_load_variables_popup_locators.py:TestLoadVariablesPopUpLocators.test_click_a_variable
# nosetests -s tests/test_load_variables_popup_locators.py:TestLoadVariablesPopUpLocators.test_click_a_variable_axes
# nosetests -s tests/test_load_variables_popup_locators.py:TestLoadVariablesPopUpLocators.test_adjust_a_variable_axes
