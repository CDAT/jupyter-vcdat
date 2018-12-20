import os
import sys
import time
import unittest
import tempfile

from selenium import webdriver
from selenium.webdriver.firefox.options import Options

from selenium.webdriver import DesiredCapabilities, Firefox
from selenium.webdriver.firefox.firefox_profile import FirefoxProfile
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from pyvirtualdisplay import Display

# NEED pytest-testconfig
#this_dir = os.path.abspath(os.path.dirname(__file__))
#lib_dir = os.path.join(this_dir, '..', 'lib')
#sys.path.append(lib_dir)

class BaseTestCase(unittest.TestCase):

    _delay = 3
    def setUp(self):        

        #_download_dir = "/tmp"
        self._download_dir = tempfile.mkdtemp()
        print("x...download_dir: {d}".format(d=self._download_dir))
        options = Options()
        #options.add_argument("--headless")
        #options.add_argument("--foreground")
        # TEMPORARY
        browser = 'chrome'
        #browser = 'firefox'
        mode = "--headless"
        #mode = "--foreground"
        if mode == "--headless":
           print("xxx starting display since we are running in headless mode")
           display = Display(visible=0, size=(800, 600))
           display.start()
        if browser == 'chrome':
            chrome_options = webdriver.ChromeOptions()
            # temporary for MacOS -- need this for macos in circleCI
            #binary_loc = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            #chrome_options.binary_location = binary_loc
            #chrome_options.add_argument("--disable-popup-blocking")
            #chrome_options.add_argument("--start-maximized")
            chrome_options.add_argument(mode)
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("window-size=1200x600")

            #preferences = {"download.default_directory": self._download_dir,
            #               "directory_upgrade": True,
            #               "safebrowsing.enabled": True,
            #               "prompt_for_download": True}
            #chrome_options.add_experimental_option("prefs", preferences)
            #self.driver = webdriver.Chrome(executable_path="/usr/local/bin/chromedriver",
            #                               chrome_options=chrome_options,
            #                               service_args=['--verbose', '--log-path=/tmp/chromedriver.log'])

            #self.driver = webdriver.Remote(command_executor='http://127.0.0.1:4444/wd/hub',
            self.driver = webdriver.Remote(command_executor='http://localhost:4444/wd/hub',
                                           desired_capabilities=DesiredCapabilities.CHROME,
                                           options=chrome_options)

        elif browser == 'firefox':
            firefox_profile = FirefoxProfile() # profile                                                                            
            firefox_profile.set_preference('extensions.logging.enabled', False)
            firefox_profile.set_preference('network.dns.disableIPv6', False)
            firefox_profile.set_preference('browser.download.dir', self._download_dir)
            firefox_profile.set_preference('browser.download.folderList', 2)
            firefox_profile.set_preference('browser.download.useDownloadDir', True)
            firefox_profile.set_preference('browser.download.panel.shown', False)
            firefox_profile.set_preference('browser.download.manager.showWhenStarting', False)
            firefox_profile.set_preference('browser.download.manager.showAlertOnComplete', False)
            firefox_profile.set_preference("browser.helperApps.neverAsk.saveToDisk", "application/x-netcdf");
            
            firefox_capabilities = DesiredCapabilities().FIREFOX
            firefox_capabilities['marionette'] = True
            firefox_capabilities['moz:firefoxOptions'] = {'args': ['--headless']}
            #firefox_capabilities['moz:firefoxOptions'] = {'args': ['--foreground']}

            options.binary_location = "/usr/local/bin/geckodriver"

            # TEMPORARY
            #firefox_binary = FirefoxBinary("/Applications/Firefox.app/Contents/MacOS/firefox")
            firefox_binary = FirefoxBinary("/usr/bin/firefox")
            #self.driver = webdriver.Firefox(firefox_profile=firefox_profile,
            #                                firefox_binary=firefox_binary,
            #                                options=options,
            #                                capabilities = firefox_capabilities)

            self.driver = webdriver.Firefox(firefox_profile=firefox_profile,
                                            firefox_binary=firefox_binary,
                                            executable_path="/usr/local/bin/geckodriver",
                                            options=options,
                                            capabilities = firefox_capabilities)

        self.driver.implicitly_wait(20)
        #self.driver.get("https://www.google.com")
        time.sleep(3)

    def tearDown(self):
        self.driver.quit()
