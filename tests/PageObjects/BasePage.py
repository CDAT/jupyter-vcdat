import time

from abc import abstractmethod
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains


class BasePage(object):
    """ All page objects inherit from this """

    _wait_timeout = 3
    _delay = 2

    def __init__(self, driver, server):
        self.driver = driver
        if server:
            self.load_page(server)
        self._validate_page()

    @abstractmethod
    def _validate_page(self):
        return

    def find_element_and_click(self, xpath, descr):
        try:
            elem = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, xpath)))
            print("FOUND {d}, clicking it".format(d=descr))
            elem.click()
        except TimeoutException as e:
            print("TimeoutException...not finding {d} to be clickable".format(d=descr))
            raise e

    def find_element(self, xpath, descr):
        try:
            element = self.driver.find_element_by_xpath(xpath)
            print("FOUND {d}".format(d=descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding {d}".format(d=descr))
            raise e

        return element

    def action_chains_find_element_and_click(self, xpath, descr):
        try:
            element = self.driver.find_element_by_xpath(xpath)
            action_chains = ActionChains(self.driver)
            action_chains.move_to_element(element)
            action_chains.click(element)

        except NoSuchElementException as e:
            print("NoSuchElementException...not finding {d}".format(d=descr))
            raise e

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

    def find_tab_OBSOLETE(self, tab_name):
        '''
        find the tab element ('File', 'Edit', 'View', 'Run'...) and
        return the element
        '''
        tabs_locator = "//ul[@class='p-MenuBar-content']/li"
        tabs_elements = self.driver.find_elements_by_xpath(tabs_locator)
        tab_label_locator = ".//div[@class='p-MenuBar-itemLabel']"
        for tab_element in tabs_elements:
            tab_label_element = tab_element.find_element_by_xpath(tab_label_locator)
            if tab_label_element.text == tab_name:
                return tab_label_element

    def find_menu_item_from_tab_drop_down_and_click_OBSOLETE(self, menu_item_name):
        '''
        find the specified menu item from the tab drop down, and
        click on it.
        '''
        menu_items_locator = "//ul[@class='p-Menu-content']/li"
        menu_items_elements = self.driver.find_elements_by_xpath(menu_items_locator)
        item_label_locator = "./div[@class='p-Menu-itemLabel']"
        index = 0
        for m in menu_items_elements:
            item_label_element = m.find_element_by_xpath(item_label_locator)
            if menu_item_name in item_label_element.text:
                break
            index += 1

        menu_item = menu_items_elements[index]
        print("Going to click on '{n}'".format(n=menu_item_name))
        action_chains = ActionChains(self.driver)
        action_chains.move_to_element(menu_item)
        time.sleep(self._delay)
        action_chains.click(menu_item).perform()
        time.sleep(self._delay * 2)

    def click_on_file_tab_OBSOLETE(self):
        print("...click on 'File' tab...")
        file_tab_element = self._find_tab('File')
        file_tab_element.click()
        time.sleep(self._delay)


class InvalidPageException(Exception):
    """ Throw this exception when we do not find the correct page """
    pass
