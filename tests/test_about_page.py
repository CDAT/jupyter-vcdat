import sys
import os
this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))
from AboutPage import AboutPage

class TestAboutPage(BaseTestCase):
    
    def test_about_page(self):
        # Open VCDAT about page
        about_page = AboutPage(self.driver, None)
        # Print version
        version = 0
        about_page.version_text().get_value(version)
        print("The current version is: {}".format(version))
        # Locator for dismiss button on about page
        about_page.dismiss_button().click()