import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from BaseTestCaseWithNoteBook import BaseTestCaseWithNoteBook
from VcdatPanel import VcdatPanel


class TestLoadVariable(BaseTestCaseWithNoteBook):

    def test_load_a_variable(self):
        '''
        load 'clt.nc' file, and load 'v' variable, and plot
        '''
        test_file = "clt.nc"
        self.main_page.click_on_folder_tab()
        self.main_page.click_on_vcdat_icon()

        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables_by_file()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_edit_button('v')
        load_variable_popup.click_on_variable_axes('v')
        load_variable_popup.click_on_load()
        vcdat_panel.click_on_plot()

# nosetests -s tests/test_load_a_variable.py:TestLoadVariable.test_load_a_variable
