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

        browser = os.getenv("BROWSER_TYPE", 'chrome')
        mode = os.getenv("BROWSER_MODE", '--headless')
        print("xxx browser: {b}".format(b=browser))
        print("xxx mode: {m}".format(m=mode))

        if mode == "--headless" and os.getenv("CIRCLECI") == True:
           print("...starting display since we are running in headless mode")
           display = Display(visible=0, size=(800, 600))
           display.start()

        if browser == 'chrome':
            print("DEBUG browser is 'chrome'")
            chrome_options = webdriver.ChromeOptions()
            chrome_options.add_argument(mode)
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("window-size=1200x600")
            self.driver = webdriver.Chrome(executable_path="/usr/local/bin/chromedriver",
                                           chrome_options=chrome_options,
                                           service_args=['--verbose', '--log-path=/tmp/chromedriver.log'])
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
            firefox_capabilities = DesiredCapabilities().FIREFOX
            firefox_capabilities['marionette'] = True
            firefox_capabilities['moz:firefoxOptions'] = {'args': ['--headless']}
            options.binary_location = "/usr/local/bin/geckodriver"

            firefox_binary = FirefoxBinary("/usr/local/bin/firefox")
            self.driver = webdriver.Firefox(firefox_profile=firefox_profile,
                                            firefox_binary=firefox_binary,
                                            executable_path="/usr/local/bin/geckodriver",
                                            options=options,
                                            capabilities = firefox_capabilities)

        self.driver.implicitly_wait(20)
        time.sleep(3)

    def tearDown(self):
        self.driver.quit()
