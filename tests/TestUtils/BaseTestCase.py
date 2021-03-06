from JupyterUtils import JupyterUtils
from MainPage import MainPage
from pyvirtualdisplay import Display
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium.webdriver.firefox.firefox_profile import FirefoxProfile
from selenium.webdriver import DesiredCapabilities
from selenium import webdriver
import tempfile
import unittest
import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, '..', 'PageObjects'))


class BaseTestCase(unittest.TestCase):
    '''
    Following env variable should be set:
    BROWSER_MODE: '--foreground' or '--headless'
    BROWSER_TYPE: 'chrome' or 'firefox'
    BROWSER_DRIVER: full path to your browser driver (chromedriver or geckodriver)
    If running with firefox on Linux, should also set:
       BROWSER_BINARY: full path to your firefox binary
    '''
    _delay = 1
    _wait_timeout = 7

    def setUp(self):
        print("\n\n#########...{}...".format(self._testMethodName))
        self._download_dir = tempfile.mkdtemp()
        browser = os.getenv("BROWSER_TYPE", 'chrome')
        mode = os.getenv("BROWSER_MODE", '--headless')
        print("...browser: {b}".format(b=browser))
        print("...mode: {m}".format(m=mode))

        if mode == "--headless" and os.getenv("CIRCLECI"):
            print("...starting display since we are running in headless mode")
            display = Display(visible=0, size=(800, 600))
            display.start()

        if browser == 'chrome':
            self.setup_for_chrome(mode)
        elif browser == 'firefox':
            self.setup_for_firefox(mode)

        self.driver.implicitly_wait(self._wait_timeout)

        utils = JupyterUtils()
        self.server = utils.get_server()
        self.main_page = MainPage(self.driver, self.server)
        print("...BaseTestCase.setUp() Complete...")

    def tearDown(self):
        print("...BaseTestCase.tearDown()...")
        self.main_page.jupyter_icon().silent().click()
        self.main_page.top_menu_item("File", "Save All").silent().click()
        self.main_page.top_menu_item("File", "Close All Tabs").silent().click()
        self.main_page.dialog_btn("OK").attempt().silent().click()
        self.main_page.shutdown_all_kernels(False)
        self.driver.quit()

    def setup_for_chrome(self, mode):
        chrome_options = webdriver.ChromeOptions()
        chrome_options.add_argument(mode)
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("window-size=1200x1200")
        # Set up download directory
        """https://stackoverflow.com/questions/18437816/
        how-to-find-chrome-download-path-in-java"""
        prefs = {
            "download": {
                "default_directory": os.getcwd()
            }
        }
        """
        http://makeseleniumeasy.com/2018/08/25/how-to-change-default-
        download-directory-for-chrome-browser-in-selenium-webdriver/
        """
        chrome_options.add_experimental_option("prefs", prefs)
        self.driver = webdriver.Chrome(executable_path=os.getenv("BROWSER_DRIVER", "/usr/local/bin/chromedriver"),
                                       chrome_options=chrome_options,
                                       service_args=['--verbose', '--log-path=/tmp/chromedriver.log'])

    def setup_for_firefox(self, mode):
        firefox_profile = FirefoxProfile()
        firefox_profile.set_preference('dom.disable_open_during_load', False)
        firefox_capabilities = DesiredCapabilities().FIREFOX
        firefox_capabilities['marionette'] = True
        firefox_capabilities['moz:firefoxOptions'] = {'args': ['--headless']}

        firefox_binary = FirefoxBinary(
            os.getenv("BROWSER_BINARY", "/usr/bin/firefox"))
        geckodriver_loc = os.getenv(
            "BROWSER_DRIVER", "/usr/local/bin/geckodriver")
        self.driver = webdriver.Firefox(firefox_profile=firefox_profile,
                                        firefox_binary=firefox_binary,
                                        executable_path=geckodriver_loc,
                                        capabilities=firefox_capabilities)
        self.set_viewport_size(1200, 1200)  # Ensure viewport is large enough

    def set_viewport_size(self, width, height):
        window_size = self.driver.execute_script("""
            return [window.outerWidth - window.innerWidth + arguments[0],
            window.outerHeight - window.innerHeight + arguments[1]];
            """, width, height)
        self.driver.set_window_size(*window_size)
