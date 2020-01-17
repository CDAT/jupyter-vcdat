import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from BaseTestCaseWithNoteBook import BaseTestCaseWithNoteBook
from VcdatPanel import VcdatPanel


def debug_print(s):
    DEBUG = True
    if DEBUG:
        print(s)


def assert_image_tag_present(html_file):
    debug_print('Assert image tag is present')
    image_tag_present = False
    with open(html_file, 'r') as f:
        for line in f:
            # If SLIDERS_ENABLED is False, then this tag appears in the HTML.
            # If SLIDERS_ENABLED is True, then this tag does not appear in the HTML.
            # However, the image itself still appears.
            if '<img' in line:
                image_tag_present = True
    assert image_tag_present


class TestExportHTML(BaseTestCaseWithNoteBook):
    """
    This class has methods to test exporting to HTML.
    """

    def setUp(self):
        """
        Open, edit, and save the notebook before each test.
        """
        super(TestExportHTML, self).setUp()
        notebook = self.notebooks[0]
        test_file = "clt.nc"
        notebook.click_on_folder_tab()
        notebook.click_on_vcdat_icon()
        vcdat_panel = VcdatPanel(self.driver, None)
        file_browser = vcdat_panel.click_on_load_variables_by_file()
        load_variable_popup = file_browser.double_click_on_a_file(test_file)
        load_variable_popup.click_on_variable('v')
        load_variable_popup.click_on_load()
        vcdat_panel.click_on_plot()
        notebook.save_current_notebook()
        self.notebook_name = notebook.notebook_name

    def execute_notebook_via_web(self):
        """
        Execute the notebook via web interface.
        """
        debug_print('Execute the notebook via web interface.')
        self.notebooks[0].click_on_running_tab()

    def check_image_tag_in_html(self):
        """
        Check that the HTML file contains an image tag.
        """
        debug_print('Check that HTML contains image.')
        html_path = self.notebook_name.replace('.ipynb', '.html')
        # TODO: Is checking the image tag exists good enough?
        #  Or should we open the html file using Selenium?
        assert_image_tag_present(html_path)

    def test_export_plot_html_via_button(self):
        """
        Test that running a notebook and then exporting to HTML via the "Export Notebook as" button displays the plot in the HTML.
        """
        self.execute_notebook_via_web()
        # File > Export as > Export as HTML
        debug_print('Click button to download as HTML.')
        self.notebooks[0].click_on_export_to_HTML()
        self.check_image_tag_in_html()

    def test_export_plot_html_via_nbconvert(self):
        """
        Test that running a notebook and then exporting to HTML via `jupyter nbconvert --to html` displays the plot in the HTML.
        """
        self.execute_notebook_via_web()
        debug_print('Convert the notebook.')
        convert_command = 'jupyter nbconvert --to html {}'.format(self.notebook_name)
        assert os.system(convert_command) == 0
        self.check_image_tag_in_html()

    def test_export_plot_html_via_nbconvert_execute(self):
        """
        Test that running `jupyter nbconvert --execute --to html` displays the plot in the HTML.
        """
        debug_print('Execute and convert the notebook in one step.')
        command = 'jupyter nbconvert --to html --execute {}'.format(self.notebook_name)
        assert os.system(command) == 0
        self.check_image_tag_in_html()
