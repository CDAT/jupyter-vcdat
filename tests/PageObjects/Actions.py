import time
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By

""" Class used to call functions within a locator """


class Action:
    def __init__(self, action, descr, *args):
        self.action = action
        self.description = descr
        self.arguments = args

    def perform(self, verbose=True):
        try:
            if verbose and self.description is not None:
                print(self.description)
            if self.arguments is not None:
                return self.action(*self.arguments)
            else:
                return self.action()
            self.__reset_defaults__()
        except Exception as e:
            print(e)
            if self.description is not None and self.arguments is not None:
                print(
                    "Attempt to do: '{}' failed.\nArguments: {}".format(
                        self.description, self.arguments
                    )
                )
            elif self.description is not None:
                print("Attempt to do: '{}' failed.".format(self.description))
            else:
                print("Arguments: {}".format(self.arguments))
            raise (e)


""" All page objects inherit from this """


class Actions(object):

    _delay = 1
    _a_bit_delay = 0.5

    def __init__(self, driver, server):
        self.driver = driver

    # Converts a locator type: "id", "class", "css", "xpath" into a method
    def locator_type_to_method(self, locator):
        method = By.XPATH
        if locator == "css":
            method = By.CSS_SELECTOR
        elif locator == "class":
            method = By.CLASS_NAME
        elif locator == "id":
            method = By.ID

        return method

    def enter_input_text(self, input_area, text):
        input_area.clear()
        ac = ActionChains(self.driver)
        ac.click(input_area).send_keys(text).perform()
        # time.sleep(self._delay)

    def move_only(self, element, amount):
        ac = ActionChains(self.driver)
        ac.move_to_element(element)
        ac.pause(amount)
        ac.perform()

    def click_only(self, element):
        element.click()

    def move_offset(self, element, x, y):
        ac = ActionChains(self.driver)
        ac.move_to_element_with_offset(element, x, y)
        ac.perform()

    def move_to_click(self, element):
        ac = ActionChains(self.driver)
        ac.move_to_element(element)
        ac.pause(1)
        ac.click()
        ac.perform()

    def drag_and_drop(self, element, x, y):
        ac = ActionChains(self.driver)
        ac.pause(1)
        ac.drag_and_drop_by_offset(element, x, y)
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
        self.scroll_into_view(element)
        ac = ActionChains(self.driver)
        ac.move_to_element(element)
        ac.pause(1)
        ac.click()
        ac.perform()
        # time.sleep(self._delay)

    def wait(self, amount):
        print("Waiting for {} seconds...".format(amount))
        time.sleep(amount)

    def wait_to_click(self, loc_type, locator):
        method = self.locator_type_to_method(loc_type)
        wait = WebDriverWait(self.driver, 10)
        m = wait.until(EC.element_to_be_clickable((method, locator)))
        m.click()

    def wait_till_element_is_visible(self, method, locator, descr):
        try:
            wait = WebDriverWait(self.driver, 10)
            element = wait.until(
                EC.visibility_of_element_located((method, locator)))
            print("'{}' is now visible".format(descr))
            return element
        except TimeoutException as e:
            print("Timeout in waiting for element to be visible '{}'...".format(descr))
            raise e

    def wait_till_element_is_clickable(self, method, locator, descr):
        try:
            wait = WebDriverWait(self.driver, 15)
            element = wait.until(EC.element_to_be_clickable((method, locator)))
            print("'{}' is now clickable".format(descr))
            return element
        except TimeoutException as e:
            print(
                "Timeout in waiting for element to be clickable '{}'...".format(
                    descr)
            )
            raise e
