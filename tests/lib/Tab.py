import requests
import time

from abc import abstractmethod

from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions

class Tab(object):

    _delay = 3

    def __init__(self, driver, title):
        self.driver = driver
        self._validate(title)

    def _validate(self, title):
        title_locator = "//div[contains(text(), '{t}')]".format(t=title)
        self.driver.find_element_by_xpath(title_locator)   

class ConsoleTab(Tab):

    def __init(self, driver, title):
        super(ConsoleTab, self).__init(driver, title)


