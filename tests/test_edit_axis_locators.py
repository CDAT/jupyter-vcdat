import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from VcdatPanel import VcdatPanel
from BaseTestCaseWithNoteBook import BaseTestCaseWithNoteBook


class TestEditAxis(BaseTestCaseWithNoteBook):

    def test_edit_axis(self):

        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()

        edit_axis_popup = vcdat_panel.click_on_edit_button_for_variable('v')
        edit_axis_popup.adjust_var_axes_slider('v', 'latitude2', 10, -10)
        edit_axis_popup.click_on_update()
        vcdat_panel.click_on_plot()

# nosetests -s tests/test_edit_axis_locators.py:TestEditAxis.test_edit_axis
