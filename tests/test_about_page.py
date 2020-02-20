import sys
import os
this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))
from BaseTestCase import BaseTestCase
from JupyterUtils import JupyterUtils
from AboutPage import AboutPage

# To run these tests: npx task test -c test_about_page

class TestAboutPage(BaseTestCase):

    def test_about_page(self):
        # Open VCDAT about page
        about_page = AboutPage(self.driver, self.server)
        # Get version shown in about page
        version = about_page.version()
        print("The current version shown is: {}".format(version))

        # Compare to actual version
        utils = JupyterUtils()
        actual_version = utils.get_package_version()
        print("Actual version is: {}".format(actual_version))

        if version != actual_version:
            print("Versions don't match!")
        else:
            print("Versions matched!")
        assert version == actual_version

        # Locator for dismiss button on about page
        about_page.dismiss_button().click()
