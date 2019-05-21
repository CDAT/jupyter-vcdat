import os
import sys
import time

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from VcdatPanel import VcdatPanel
from BaseTestCaseWithNoteBook import BaseTestCaseWithNoteBook


class TestPlot(BaseTestCaseWithNoteBook):
    """
    This class has methods to test locators related to the plotting
    functionalities.
    """
    def test_plot(self):
        '''
        load 'clt.nc' file, and load 'v' variable, and plot
        '''
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()
        vcdat_panel.click_on_plot()

    def test_select_plot_type(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()
        vcdat_panel.select_a_plot_type("isofill")
        vcdat_panel.click_on_plot()

    def test_select_a_template(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()
        vcdat_panel.select_a_template("default")
        vcdat_panel.click_on_plot()

    def export_plot_helper(self, vcdat_panel, export_filename, export_format):
        vcdat_panel.click_on_plot()
        save_plot_popup = vcdat_panel.click_on_export_plot()
        save_plot_popup.input_plot_file_name(export_filename)
        save_plot_popup.select_export_format(export_format)
        save_plot_popup.click_on_export()
        time.sleep(2)

    def test_export_plot(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()
        # vcdat_panel.select_a_template("default")

        # export to a unique filename for this testcase
        filename = "{t}_{f}".format(t=self._testMethodName,
                                    f="default_clt")
        export_file = os.path.join(self.workdir, filename)
        export_format = "PDF"

        vcdat_panel.click_on_plot()
        save_plot_popup = vcdat_panel.click_on_export_plot()
        save_plot_popup.input_plot_file_name(export_file)
        save_plot_popup.select_export_format(export_format)
        save_plot_popup.click_on_export()
        time.sleep(2)

        # self.export_plot_helper(vcdat_panel, export_file, "PNG")
        # self.export_plot_helper(vcdat_panel, export_file, "PDF")
        # self.export_plot_helper(vcdat_panel, export_file, "SVG")
        # self.export_plot_helper(vcdat_panel, export_file, "PS")

    def test_export_plot_adjust_unit(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()

        # export to a unique filename for this testcase
        filename = "{t}_{f}".format(t=self._testMethodName,
                                    f="clt_adjust_unit")
        export_file = os.path.join(self.workdir, filename)
        export_format = "PNG"

        vcdat_panel.click_on_plot()
        save_plot_popup = vcdat_panel.click_on_export_plot()
        save_plot_popup.input_plot_file_name(export_file)
        save_plot_popup.select_export_format(export_format)
        save_plot_popup.select_custom_dimensions()
        save_plot_popup.click_on_custom_dimensions_unit("px")
        # save_plot_popup.enter_unit_width(700)
        # save_plot_popup.enter_unit_height(500)
        save_plot_popup.enter_unit_width(814)
        save_plot_popup.enter_unit_height(606)
        save_plot_popup.click_on_export()

    def test_capture_provenance(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()

        # export to a unique filename for this testcase
        filename = "{t}_{f}".format(t=self._testMethodName,
                                    f="clt_adjust_unit")
        export_file = os.path.join(self.workdir, filename)
        export_format = "PNG"

        vcdat_panel.click_on_plot()
        save_plot_popup = vcdat_panel.click_on_export_plot()
        save_plot_popup.input_plot_file_name(export_file)
        save_plot_popup.select_export_format(export_format)
        save_plot_popup.select_capture_provenance()
        save_plot_popup.click_on_export()

    def test_select_deselect_variable(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('u')
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()

        vcdat_panel.deselect_variable('v')
        vcdat_panel.deselect_variable('u')
        vcdat_panel.select_variable('u')
        vcdat_panel.click_on_plot()

    def test_edit_variable(self):
        test_file = "clt.nc"
        self.main_page.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables()

        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('clt')
        load_variable_popup.click_on_variable('u')
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()

        vcdat_panel.click_on_edit_button_for_variable('u')
        # HERE HERE continue
        time.sleep(4)


# nosetests -s tests/test_plot_locators.py:TestPlot.test_plot
# nosetests -s tests/test_plot_locators.py:TestPlot.test_select_plot_type
# nosetests -s tests/test_plot_locators.py:TestPlot.test_select_a_template
# nosetests -s tests/test_plot_locators.py:TestPlot.test_export_plot
# nosetests -s tests/test_plot_locators.py:TestPlot.test_export_plot_adjust_unit
# nosetests -s tests/test_plot_locators.py:TestPlot.test_capture_provenance
# nosetests -s tests/test_plot_locators.py:TestPlot.test_select_deselect_variable
# nosetests -s tests/test_plot_locators.py:TestPlot.test_edit_variable
