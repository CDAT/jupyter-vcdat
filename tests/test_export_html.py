from LoadVariablesPopUp import LoadVariablesPopUp
from FileBrowser import FileBrowser
from VcdatPanel import VcdatPanel
from BaseTestCase import BaseTestCase
import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))


"""
UTILITY FUNCTIONS
"""


def debug_print(s):
    DEBUG = True
    if DEBUG:
        print(s)


def assert_image_tag_present(html_file):
    debug_print('Assert image tag is present')
    image_tag_present = False
    with open(html_file, 'r') as f:
        for line in f:
            # If SLIDERS_ENABLED is False, then this tag appears in the HTML, as does the image.
            # If SLIDERS_ENABLED is True, then this tag does not appear in the HTML.
            # However, the image itself may or may not appear.
            if '<img' in line:
                image_tag_present = True
    assert image_tag_present


def prepare(self, notebook):
    """
    Open, edit, and save the notebook before each test.
    """
    self.test_file = "clt.nc"
    self.file_browser = FileBrowser(self.driver, None)
    self.vcdat_panel = VcdatPanel(self.driver, None)

    # Ensure the home directory working directory
    self.file_browser.folder_icon().click()

    # Open file for test
    self.main_page.create_notebook(notebook)
    load_variables_popup = self.file_browser.open_load_variables_popup(self.test_file)
    load_variables_popup.variable_btn('v').click()
    load_variables_popup.load_button().click()
    self.vcdat_panel.plot_btn().click()
    self.main_page.save_notebook()


def check_image_tag_in_html(notebook):
    """
    Check that the HTML file contains an image tag.
    """
    debug_print('Check that HTML contains image.')
    html_path = notebook.replace('.ipynb', '.html')
    assert_image_tag_present(html_path)


class TestExportHTML(BaseTestCase):
    """
    This class has methods to test exporting to HTML.
    """

    def test_export_plot_html_via_button(self):
        """
        Test that running a notebook and then exporting to HTML via the 
        "Export Notebook as" button displays the plot in the HTML.
        """
        NOTEBOOK_NAME = "test_export_plot_html_via_button.ipynb"
        prepare(self, NOTEBOOK_NAME)
        self.main_page.run_notebook_cells()
        # File > Export as > Export as HTML
        debug_print('Click button to download as HTML.')
        self.main_page.sub_menu_item(
            "File", "Export Notebook As", "Export Notebook to HTML").click().sleep(1)
        # Wait for HTML file to be created.
        check_image_tag_in_html(NOTEBOOK_NAME)
        os.remove(NOTEBOOK_NAME)

    def test_export_plot_html_via_nbconvert(self):
        """
        Test that running a notebook and then exporting to HTML via 
        `jupyter nbconvert --to html` displays the plot in the HTML.
        """
        NOTEBOOK_NAME = "test_export_plot_html_via_nbconvert"
        prepare(self, NOTEBOOK_NAME)
        self.main_page.run_notebook_cells()
        debug_print('Convert the notebook.')
        convert_command = 'jupyter nbconvert --to html {}'.format(
            self.notebook_name)
        assert os.system(convert_command) == 0
        check_image_tag_in_html(NOTEBOOK_NAME)
        os.remove(NOTEBOOK_NAME)

    def test_export_plot_html_via_nbconvert_execute(self):
        """
        Test that running `jupyter nbconvert --execute --to html` displays the plot in the HTML.
        """
        NOTEBOOK_NAME = "test_export_plot_html_via_nbconvert"
        prepare(self, NOTEBOOK_NAME)
        debug_print('Execute and convert the notebook in one step.')
        command = 'jupyter nbconvert --to html --execute {}.ipynb'.format(
            NOTEBOOK_NAME)
        assert os.system(command) == 0
        self.check_image_tag_in_html(NOTEBOOK_NAME)
        os.remove(NOTEBOOK_NAME)
