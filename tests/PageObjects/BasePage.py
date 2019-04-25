import time

from abc import abstractmethod
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class BasePage(object):
    """ All page objects inherit from this """

    _wait_timeout = 10
    _delay = 0.5

    def __init__(self, driver, server):
        self.driver = driver
        if server:
            self.load_page(server)
        self._validate_page()

    @abstractmethod
    def _validate_page(self):
        return

    def find_element_and_click(self, xpath, descr):
        '''
        finds an element with the specified xpath.
        If failed to find the element, log with with the specified description.
        xpath: XPath describing the element to locate
        descr: a description for logging

        This method does 'scrollIntoView' to make sure the element to be
        located is within view. Otherwise, it does not work with Firefox.
        '''
        try:
            elem = self.driver.find_element_by_xpath(xpath)
            self.driver.execute_script("return arguments[0].scrollIntoView(true);", elem)
            print("FOUND {d}, clicking it".format(d=descr))
            elem.click()
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding {d}".format(d=descr))
            raise e

    def find_element(self, xpath, descr):
        try:
            element = self.driver.find_element_by_xpath(xpath)
            print("FOUND {d}".format(d=descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding {d}".format(d=descr))
            raise e
        return element

    def load_page(self, server, expected_element=(By.TAG_NAME, 'html'),
                  timeout=_wait_timeout):
        url = server
        print("...load_page, url: {u}".format(u=url))
        try:
            self.driver.get(url)
        except TimeoutException:
            assert(False), "page not found or timeout for {0}".format(url)

        element = EC.presence_of_element_located(expected_element)
        try:
            WebDriverWait(self.driver, timeout).until(element)
        except TimeoutException:
            assert(False), "page not found or timeout  for {0}".format(url)
        time.sleep(self._delay)


class InvalidPageException(Exception):
    """ Throw this exception when we do not find the correct page """
    pass
