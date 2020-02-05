import time
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys

""" Class used to call functions within a locator """


class Action:
    def __init__(self, action, descr=None, *args):
        self.action = action
        self.description = descr
        self.arguments = args

    def perform(self):
        try:
            if self.description is not None:
                print(self.description)
            if self.arguments is not None:
                self.action(*self.arguments)
            else:
                self.action()
        except Exception as e:
            print(e)
            if self.description is not None and self.arguments is not None:
                print("Attempt to do: '{}' failed.\nArguments: {}".format(
                    self.description, self.arguments))
            elif self.description is not None:
                print("Attempt to do: '{}' failed.".format(self.description))
            else:
                print("Arguments: {}".format(self.arguments))
            raise(e)


""" All page objects inherit from this """


class Actions(object):

    _delay = 1
    _a_bit_delay = 0.5

    def __init__(self, driver, server=None):
        self.driver = driver

    def enter_input_text(self, input_area, text):
        input_area.clear()
        ac = ActionChains(self.driver)
        ac.click(input_area).send_keys(text).perform()
        time.sleep(self._delay)

    # Returns an element using the item's locator string
    # Locator string type can be: id, class, css or xpath (default)
    def find_element(self, locator, locator_type="xpath"):
        valid = ["id", "class", "css", "xpath"]
        if locator_type not in valid:
            raise ValueError("Invalid locator type pass to function.")
            return None
        try:
            if locator_type == "id":
                element = self.driver.find_element_by_id(locator)
            elif locator_type == "class":
                element = self.driver.find_element_by_class_name(locator)
            elif locator_type == "css":
                element = self.driver.find_element_by_css_selector(locator)
            elif locator_type == "xpath":
                element = self.driver.find_element_by_xpath(locator)
        except NoSuchElementException:
            return None
        return element

    # Returns multiple element that match the locator string
    # Locator string type can be: id, class, css or xpath (default)
    def find_elements(self, locator, locator_type="xpath"):
        valid = ["id", "class", "css", "xpath"]
        if locator_type not in valid:
            raise ValueError("Invalid locator type pass to function.")
        try:
            if locator_type == "id":
                elements = self.driver.find_elements_by_id(locator)
            elif locator_type == "class":
                elements = self.driver.find_elements_by_class_name(locator)
            elif locator_type == "css":
                elements = self.driver.find_elements_by_css_selector(locator)
            elif locator_type == "xpath":
                elements = self.driver.find_elements_by_xpath(locator)
        except NoSuchElementException:
            return False
        return elements

    def get_text(self, element):
        return element.get_attribute("value")

    def move_to_click(self, element):
        ac = ActionChains(self.driver)
        ac.move_to_element(element)
        ac.click()
        ac.perform()

    def move_to_double_click(self, element):
        ac = ActionChains(self.driver)
        ac.move_to_element(element)
        ac.double_click(element)
        ac.perform()

    def input_press_enter(self, input_area):
        ac = ActionChains(self.driver)
        ac.click(input_area).key_down(Keys.ENTER).perform()

    def scroll_into_view(self, element):
        """
        when a page/area gets expanded and elements got shifted down,
        we may need to call this method to scroll the page so that the
        element is within the viewing window before clicking on the
        element.
        """
        script = "return arguments[0].scrollIntoView(true);"
        self.driver.execute_script(script, element)

    def scroll_to_click(self, element):
        script = "return arguments[0].scrollIntoView(true);"
        self.driver.execute_script(script, element)
        element.click()
        time.sleep(self._delay)

    def wait(self):
        print("Waiting for {} seconds...".format(amount))
        time.sleep(amount)

    def wait_click(self, method, locator):
        try:
            print("...wait_click..., locator: {}".format(locator))
            wait = WebDriverWait(self.driver, 15)
            m = wait.until(EC.element_to_be_clickable((method,
                                                       locator)))
            m.click()
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("...error clicking item...")
            raise e

    def wait_till_element_is_visible(self, method, locator, descr):
        try:
            wait = WebDriverWait(self.driver, 15)
            element = wait.until(EC.visibility_of_element_located((method,
                                                                   locator)))
            print("'{}' is now visible".format(descr))
            return element
        except TimeoutException as e:
            print("Timeout in waiting for element to be visible '{}'...".format(descr))
            raise e

    def wait_till_element_is_clickable(self, method, locator, descr):
        try:
            wait = WebDriverWait(self.driver, 15)
            element = wait.until(EC.element_to_be_clickable((method,
                                                             locator)))
            print("'{}' is now clickable".format(descr))
            return element
        except TimeoutException as e:
            print("Timeout in waiting for element to be clickable '{}'...".format(descr))
            raise e
