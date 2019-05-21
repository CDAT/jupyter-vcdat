import time

from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys

""" All page objects inherit from this """


class Actions(object):

    _delay = 0.5
    _a_bit_delay = 0.5

    def __init__(self, driver, server=None):
        self.driver = driver

    def find_element_by_id(self, id, descr):
        try:
            element = self.driver.find_element_by_id(id)
            print("FOUND {}".format(descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding '{}'".format(descr))
            raise e
        return element

    def find_elements_by_id(self, id, descr):
        try:
            elements = self.driver.find_elements_by_id(id)
            print("FOUND {}".format(descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding '{}'".format(descr))
            raise e
        return elements

    def find_element_by_class(self, class_name, descr):
        try:
            element = self.driver.find_element_by_class_name(class_name)
            print("FOUND {}".format(descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding '{}'".format(descr))
            raise e
        return element

    def find_elements_by_class(self, class_name, descr):
        try:
            elements = self.driver.find_elements_by_class_name(class_name)
            print("FOUND {}".format(descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding '{}'".format(descr))
            raise e
        return elements

    def find_element_by_xpath(self, xpath, descr):
        try:
            element = self.driver.find_element_by_xpath(xpath)
            print("FOUND {}".format(descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding {}".format(descr))
            raise e
        return element

    def find_elements_by_xpath(self, xpath, descr):
        try:
            elements = self.driver.find_elements_by_xpath(xpath)
            print("FOUND {}".format(descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding {}".format(descr))
            raise e
        return elements

    def find_element_by_css(self, css_selector, descr):
        try:
            element = self.driver.find_element_by_css_selector(css_selector)
            print("FOUND {}".format(descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding '{}'".format(descr))
            raise e
        return element

    def find_elements_by_css(self, css_selector, descr):
        try:
            elements = self.driver.find_element_by_css_selector(css_selector)
            print("FOUND {}".format(descr))
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding '{}'".format(descr))
            raise e
        return elements

    def move_to_click(self, element):
        time.sleep(self._a_bit_delay)
        print("...move_to_click...")
        ActionChains(self.driver).move_to_element(element).click().perform()

    def move_to_double_click(self, element):
        print("...move_to_double_click...")
        time.sleep(self._a_bit_delay)
        ac = ActionChains(self.driver)
        ac.move_to_element(element)
        ac.double_click(element)
        ac.perform()

    def scroll_click(self, element):
        print("...scroll_click...")
        try:
            self.driver.execute_script(
                "return arguments[0].scrollIntoView(true);", element)
            element.click()
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print(
                "Error when clicking on element...")
            raise e

    def wait_click(self, method, locator):
        try:
            print("...wait_click..., locator: {}".format(locator))
            wait = WebDriverWait(self.driver, 10)
            m = wait.until(EC.element_to_be_clickable((method,
                                                       locator)))
            m.click()
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("...error clicking item...")
            raise e

    def enter_text(self, input_area, text):
        input_area.clear()
        ac = ActionChains(self.driver)
        ac.click(input_area).send_keys(text).key_down(Keys.ENTER).perform()
        time.sleep(self._delay)

    def open_file_browser(self):
        try:
            self.dropdown_click(self.locate_running_tab())
            self.dropdown_click(self.locate_file_tab())
        except NoSuchElementException as e:
            print(
                "NoSuchElementException...could not open filebrowser")
            raise e

    def open_vcdat_widget(self):
        try:
            self.dropdown_click(self.locate_running_tab())
            self.dropdown_click(self.locate_vcdat_icon())
        except NoSuchElementException as e:
            print(
                "NoSuchElementException...could not open vcdat widget")
            raise e

    def wait_till_element_is_visible(self, method, locator, descr):
        try:
            wait = WebDriverWait(self.driver, 20)
            element = wait.until(EC.visibility_of_element_located((method,
                                                                   locator)))
            print("'{}' is now visible".format(descr))
            return element
        except TimeoutException as e:
            print("Timeout in waiting for element to be visible '{}'...".format(descr))
            raise e

    def wait_till_element_is_clickable(self, method, locator, descr):
        try:
            wait = WebDriverWait(self.driver, 20)
            element = wait.until(EC.element_to_be_clickable((method,
                                                             locator)))
            print("'{}' is now clickable".format(descr))
            return element
        except TimeoutException as e:
            print("Timeout in waiting for element to be clickable '{}'...".format(descr))
            raise e
