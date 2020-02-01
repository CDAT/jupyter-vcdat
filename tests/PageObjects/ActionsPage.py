import time

from abc import abstractmethod
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from Actions import Actions


class ActionsPage(Actions):

    _wait_timeout = 15

    def __init__(self, driver, server):
        super(ActionsPage, self).__init__(driver, server)
        if server:
            self.load_page(server)
        self._validate_page()

    @abstractmethod
    def _validate_page(self):
        return

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
