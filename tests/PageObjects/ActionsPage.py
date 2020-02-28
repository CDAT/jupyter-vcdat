from abc import abstractmethod
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from Actions import Action, Actions
from Locator import Locator


class ActionsPage(Actions):

    _wait_timeout = 10

    def __init__(self, driver, server):
        super(ActionsPage, self).__init__(driver, server)
        if server:
            self.load_page(server)
        self._validate_page()
        self.browser = self.get_browser()

    @abstractmethod
    def _validate_page(self):
        return

    def load_page(
        self, server, expected_element=(By.TAG_NAME, "html"), timeout=_wait_timeout
    ):
        url = server
        print("...load_page, url: {u}".format(u=url))
        try:
            self.driver.get(url)
        except TimeoutException:
            assert False, "Page not found or timeout for {0}".format(url)
        element = EC.presence_of_element_located(expected_element)
        try:
            WebDriverWait(self.driver, timeout).until(element)
        except TimeoutException:
            assert False, "Page not found or timeout  for {0}".format(url)

    # Returns the name of the current browser
    def get_browser(self):
        browser = self.driver.capabilities['browserName']
        print("Browser is: {}".format(browser))
        return browser

    # Creates a locator object (single element) with the driver added
    def locator(self, loc, loc_type, descr="", req=None):
        return Locator(self.driver, loc, loc_type, descr, False, req)

    # Creates locators object (multiple elements) with the driver added
    def locators(self, loc, loc_type, descr="", req=None):
        return Locator(self.driver, loc, loc_type, descr, True, req)

    # Creates an action object
    def action(self, action, descr, *args):
        return Action(action, descr, *args)


class InvalidPageException(Exception):
    """ Throw this exception when we do not find the correct page """

    pass
