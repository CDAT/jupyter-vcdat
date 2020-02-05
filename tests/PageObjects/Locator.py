import time
from Actions import Action, Actions
from selenium.common.exceptions import NoSuchElementException

""" 
Locator object which will allow actions to be performed on an element while
also ensuring the element requirements have been tried if element is not found
the first time. Raises NoSuchElementException is attempt to locate fails
"""


class Locator(Actions):
    def __init__(self, driver, loc, loc_type, descr="element", *reqs):
        self.driver = driver
        self.locator = loc
        self.locator_type = loc_type
        self.description = descr
        self.requirements = reqs
        self.element = None
        self.__set_defaults__()

    """--------------- Helper Functions ---------------"""

    def __set_defaults__(self):
        # Action Modifier, will modify how action is performed if set to true
        self.__LAZY__ = False  # Quit looking for element after first try

    # Will perform requirement actions to prepare for getting locator
    def __prepare__(self):
        if len(self.requirements) == 0:
            return False

        for req in self.requirements:
            print("Performing preparation steps...")
            if type(req).__name__ == "Locator":
                req.click()
            elif type(req).__name__ == "Action":
                req.perform()
            else:
                if self.description != "element":
                    print("Unkown requirement in locator: {}".format(
                        self.description))
                else:
                    print("Unkown requirement in locator.")

        print("Ready to try finding {} again...".format(self.description))
        return True

    # Will print element found status using provided description
    def __describe__(self, descr, found):
        msg = "FOUND!"
        if not found:
            msg = "NOT FOUND!"
        if descr != "":
            print("[{}] {}".format(descr, msg))
        else:
            print("[Element] {}".format(msg))

    # Will find the locator element based on the modifier selected
    # extra_args -> any extra arguments to pass to action besides element
    def __perform__(self, action, descr, *extra_args):

        # Find the element using specified method
        if self.__LAZY__:
            self.__lazy_find__()
        else:
            self.__hard_find__()

        # Reset modifiers to defaults
        self.__set_defaults__()

        # Perform the specified action
        if self.element is not None:
            new_args = (self.element,) + extra_args
            Action(action, descr, *new_args).perform()

    # Will try to find element and print status, will quit if not found
    # Does not raise error if element was not found.
    def __lazy_find__(self):
        if self.locator is None:
            self.element = None
            return
        # Attempt to find element
        self.element = self.find_element(self.locator, self.locator_type)
        if self.element is not None:
            # Element was found
            self.__describe__(self.description, True)
        else:
            # Element not found, just skip
            self.__describe__(self.description, False)
            print("Element Not Found. Skipping...")

    # Will run preparations if necessary, in order to find expected element
    # Prints status and raises NoSuchElement if element could not be found
    def __hard_find__(self):
        if self.locator is None:
            self.element = None
            return
        # Attempt to find element
        self.element = self.find_element(self.locator, self.locator_type)
        if self.element is not None:
            # Element was found
            self.__describe__(self.description, True)
        else:
            # Element not found, try to prepare for it
            self.__describe__(self.description, False)
            ready = self.__prepare__()
            if ready:
                # If ready, try action again
                self.element = self.find_element(
                    self.locator, self.locator_type)
                if self.element is not None:
                    # Element was found this time
                    self.__describe__(self.description, True)
                else:
                    # After preparing, element still not found
                    self.__describe__(self.description, False)
                    raise NoSuchElementException(
                        "Element {} could not be found again.".format(self.description))
            else:
                # Nothing to prepare, element was not found
                self.__describe__(self.description, False)
                raise NoSuchElementException(
                    "Element {} could not be found.".format(self.description))

    """--------------- Modifier Functions ---------------"""

    # Changes the action following this call, to be 'lazy'
    # a 'lazy' action will give up immediately and not raise an error
    # if the element was not found. Good for elements that may or may not show.
    # Usage: self.main_page.page_element().try().click()
    def lazy(self):
        self.__LAZY__ = True
        return self

    # Will sleep for specified amount of time before or after click
    # Usage: page_element().sleep(2).click() -> sleep 2 seconds before clicking
    # page_element().click().sleep(1) -> sleep 1 second after clicking
    def sleep(self, amount):
        print("Sleeping for {} seconds...".format(amount))
        time.sleep(amount)
        return self

    """--------------- Action Functions ---------------"""

    def click(self):
        self.__perform__(self.move_to_click, "Clicking...")
        return self

    def double_click(self):
        self.__perform__(self.move_to_double_click, "Double clicking...")
        return self

    def enter_text(self, text):
        self.__perform__(self.enter_input_text, "Entering text...", text)
        return self

    def get_value(self, value_var):
        self.__perform__(self.get_value, "Reading value from element...", value_var)
        print("Value was: {}".format(value_var))
        return self

    def press_enter(self):
        self.__perform__(self.input_press_enter, "Pressing ENTER...")
        return self

    def scroll_click(self):
        self.__perform__(self.scroll_to_click, "Scroll then clicking...")
        return self

    def scroll_view(self):
        self.__perform__(self.scroll_into_view, "Scrolling into view...")
        return self
