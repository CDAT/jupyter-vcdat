import sys
import os
this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from AboutPage import AboutPage
from JupyterUtils import JupyterUtils
from BaseTestCase import BaseTestCase
# To run these tests: npx task test -c test_about_page


class TestAboutPage(BaseTestCase):

    def test_about_modal(self):
        # Open VCDAT about page
        about_page = AboutPage(self.driver, None)
        # Get version shown in about page
        version = about_page.version()
        print("The current version shown is: {}".format(version))

        # Compare to actual version
        utils = JupyterUtils()
        actual_version = utils.get_package_version()
        print("Actual version is: {}".format(actual_version))

        assert version == actual_version, "Versions don't match! Version shown: {}, actual version: {}".format(
            version, actual_version)

        # Locator for dismiss button on about page
        about_page.dismiss_button().click()
