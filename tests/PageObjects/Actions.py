import time
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from typing import Any, Callable, List, Optional, Union

""" Class used to call functions within a locator """


class Action:
    def __init__(self, action: Callable[..., Any], descr: str = None, *args: Any) -> None:
        self.action = action
        self.description = descr
        self.arguments = args

    def perform(self, verbose=True) -> Any:
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

    def __init__(self, driver: object, server: object = None) -> None:
        self.driver = driver

    # Converts a locator type: "id", "class", "css", "xpath" into a method
    def locator_type_to_method(self, locator: str) -> By:
        method = By.XPATH
        if locator == "css":
            method = By.CSS_SELECTOR
        elif locator == "class":
            method = By.CLASS_NAME
        elif locator == "id":
            method = By.ID

        return method

    def enter_input_text(self, input_area: object, text: str) -> None:
        input_area.clear()
        ac = ActionChains(self.driver)
        ac.click(input_area).send_keys(text).perform()
        time.sleep(self._delay)

    """
    # Returns an element using the item's locator string
    # Locator string type can be: id, class, css or xpath (default)
    def find_element(self, locator, locator_type="xpath"):
        valid = ["id", "class", "css", "xpath"]
        if locator_type not in valid:
            raise ValueError("Invalid locator type passed to function.")
            return None
        try:
            method = self.locator_type_to_method(locator_type)
            return self.driver.find_element(method, locator)
        except NoSuchElementException:
            return None

    # Returns multiple element that match the locator string
    # Locator string type can be: id, class, css or xpath (default)
    def find_elements(self, locator, locator_type="xpath"):
        valid = ["id", "class", "css", "xpath"]
        if locator_type not in valid:
            raise ValueError("Invalid locator type passed to function.")
        try:
            method = self.locator_type_to_method(locator_type)
            return self.driver.find_elements(method, locator)
        except NoSuchElementException:
            return False
    """

    def move_to_click(self, element: object) -> None:
        ac = ActionChains(self.driver)
        ac.move_to_element(element)
        ac.click()
        ac.perform()

    def move_to_double_click(self, element: object) -> None:
        ac = ActionChains(self.driver)
        ac.move_to_element(element)
        ac.double_click(element)
        ac.perform()

    def input_press_enter(self, input_area: object) -> None:
        ac = ActionChains(self.driver)
        ac.click(input_area).key_down(Keys.ENTER).perform()

    def scroll_into_view(self, element: object) -> None:
        """
        when a page/area gets expanded and elements got shifted down,
        we may need to call this method to scroll the page so that the
        element is within the viewing window before clicking on the
        element.
        """
        script = "return arguments[0].scrollIntoView(true);"
        self.driver.execute_script(script, element)

    def scroll_to_click(self, element: object) -> None:
        script = "return arguments[0].scrollIntoView(true);"
        self.driver.execute_script(script, element)
        element.click()
        time.sleep(self._delay)

    def wait(self) -> None:
        print("Waiting for {} seconds...".format(amount))
        time.sleep(amount)

    def wait_to_click(self, loc_type: str, locator: str) -> None:
        method = self.locator_type_to_method(loc_type)
        wait = WebDriverWait(self.driver, 15)
        m = wait.until(EC.element_to_be_clickable((method, locator)))
        m.click()
        time.sleep(self._delay)

    def wait_till_element_is_visible(self, method: By, locator: str, descr: str) -> Optional[object]:
        try:
            wait = WebDriverWait(self.driver, 15)
            element = wait.until(
                EC.visibility_of_element_located((method, locator)))
            print("'{}' is now visible".format(descr))
            return element
        except TimeoutException as e:
            print("Timeout in waiting for element to be visible '{}'...".format(descr))
            raise e

    def wait_till_element_is_clickable(self, method: str, locator: str, descr: str) -> Optional[object]:
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
