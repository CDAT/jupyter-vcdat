import time
from Actions import Action, Actions
from selenium.common.exceptions import NoSuchElementException

""" 
Locator object which will allow actions to be performed on an element while
also ensuring the element requirements have been tried if element is not found
the first time. Raises NoSuchElementException is attempt to locate fails
"""


class Locator(Actions):
    def __init__(self, driver, loc, loc_type, descr, multiple, *reqs):
        self.driver = driver
        self.locator = loc  # Valid loc types: id, class, css, xpath
        self.locator_type = loc_type
        self.description = descr
        self.is_multiple = multiple
        self.requirements = reqs
        self.is_child = False
        self.element = None
        self.__VERBOSE__ = True
        self.__set_defaults__()

    """--------------- Helper Functions ---------------"""

    def __set_defaults__(self):
        # Action Modifier, will modify how action is performed if set to true
        self.__TRY__ = False  # Quit looking for element after first try

    # Will perform requirement actions to prepare for getting locator
    def __prepare__(self):
        if self.requirements == (None,) or len(self.requirements) == 0:
            return False

        for req in self.requirements:
            if self.__VERBOSE__:
                print("Performing preparation steps...")
            if type(req).__name__ == "Locator":
                req.click()
            elif type(req).__name__ == "Action":
                req.perform(self.__VERBOSE__)
            elif self.__VERBOSE__:
                if self.description != "":
                    print("Unkown requirement in locator: {}".format(self.description))
                else:
                    print("Unkown requirement in locator")
        if self.__VERBOSE__:
            print("Ready to try finding {} again...".format(self.description))
        return True

    # Will print element found status using provided description
    def __describe__(self, descr, found):
        if not self.__VERBOSE__:
            return
        msg = "CLICKABLE!"
        if not found:
            msg = "NOT CLICKABLE!"
        if descr != "":
            print("[{}] {}".format(descr, msg))
        else:
            print("[Element] {}".format(msg))

    def __search_element__(self):
        # Find the element using specified method
        if self.__TRY__:
            self.__lazy_search__()
        else:
            self.__hard_search__()

        # Reset modifiers to defaults
        self.__set_defaults__()

        return self.clickable()

    # Will find the locator element based on the modifier selected
    # extra_args -> any extra arguments to pass to action besides element
    def __perform__(self, action, descr, *extra_args):
        # Perform the specified action if element found
        if self.__search_element__():
            new_args = (self.element,) + extra_args
            return Action(action, descr, *new_args).perform(self.__VERBOSE__)

    # Will find the element using the find actions, returns element(s) found
    def __find_element__(self, locator, locator_type):
        # Valid locator types
        valid = ["id", "class", "css", "xpath"]
        if locator_type not in valid:
            raise ValueError("Invalid locator type: {}".format(locator_type))
        try:
            # Get the proper locator method
            method = self.locator_type_to_method(locator_type)

            # If its a child element, find element within current element
            if self.is_child:
                if self.element is None:
                    return None
                if self.is_multiple:
                    return self.element.find_elements(method, locator)
                return self.element.find_element(method, locator)

            # Not a child element, return element using driver
            if self.is_multiple:
                return self.driver.find_elements(method, locator)
            return self.driver.find_element(method, locator)
        except NoSuchElementException:
            return None

    # Will try to find element and print status, will quit if not found
    # Does not raise error if element was not found.
    def __lazy_search__(self):
        if self.locator is None:
            self.element = None
            return
        # Attempt to find element
        self.element = self.__find_element__(self.locator, self.locator_type)
        if self.clickable():
            # Element was found
            self.__describe__(self.description, True)
        else:
            # Element not found, just skip
            self.__describe__(self.description, False)
            if self.__VERBOSE__:
                print("Element Not Clickable. Skipping...")

    # Will run preparations if necessary, in order to find expected element
    # Prints status and raises NoSuchElement if element could not be found
    def __hard_search__(self):
        if self.locator is None:
            self.element = None
            return
        # Attempt to find element
        self.element = self.__find_element__(self.locator, self.locator_type)
        if self.clickable():
            # Element was found
            self.__describe__(self.description, True)
        else:
            # Element not clickable, try to prepare for it
            self.__describe__(self.description, False)
            ready = self.__prepare__()
            if ready:
                # If ready, try action again
                self.element = self.__find_element__(self.locator, self.locator_type)
                if self.clickable():
                    # Element was found this time
                    self.__describe__(self.description, True)
                else:
                    # After preparing, element still not found
                    self.__describe__(self.description, False)
                    raise NoSuchElementException(
                        "Element {} is still not clickable.".format(self.description)
                    )
            else:
                # Nothing to prepare, element was not found
                self.__describe__(self.description, False)
                raise NoSuchElementException(
                    "Element {} could not be found.".format(self.description)
                )

    """--------------- Modifier Functions ---------------"""

    # Changes the action following this call, to be an 'attempt'
    # An 'attempt' action will give up immediately and not raise an error
    # if the element was not found. Good for elements that may or may not show.
    # Usage: self.main_page.page_element().attempt().click()
    def attempt(self):
        self.__TRY__ = True
        return self

    # Changes the action following this call, to be silent so that no status
    # ouput is printed to the screen after further actions
    # Usage: self.main_page.page_element().silent().click()
    def silent(self):
        self.__VERBOSE__ = False
        return self

    # Will sleep for specified amount of time before or after click
    # Usage: page_element().sleep(2).click() -> sleep 2 seconds before clicking
    # page_element().click().sleep(1) -> sleep 1 second after clicking
    def sleep(self, amount):
        if self.__VERBOSE__:
            print("Sleeping for {} seconds...".format(amount))
        time.sleep(amount)
        return self

    """--------------- Property Accessors ---------------"""
    # Will test whether current element is clickable, returns true if so

    def clickable(self):
        if self.element is None:
            return False
        return self.element.is_displayed()

    def enabled(self):
        if self.element is None:
            return False
        return self.element.is_enabled()

    # Returns true if element is selected, false otherwise
    def selected(self):
        if self.element is None:
            return False
        return self.element.is_selected()

    # Returns child element using the item's locator string (None if not found)
    # Locator string type can be: id, class, css or xpath (default)
    def find_child(self, locator, locator_type="xpath", descr=""):
        if descr == "":
            descr = "Child of: {}".format(self.description)
        locator = Locator(self.driver, locator, locator_type, descr, False)
        locator.is_child = True
        return locator

    # Returns multiple children elements that match the locator string
    # Locator string type can be: id, class, css or xpath (default)
    def find_children(self, locator, locator_type="xpath", descr=""):
        if descr == "":
            descr = "Children of: {}".format(self.description)
        locator = Locator(self.driver, locator, locator_type, descr, True)
        locator.is_child = True
        return locator

    # Returns true if the element was found, otherwise false
    def found(self):
        return self.__search_element__()

    # Attempts to find  the element and returns locator when done
    def get(self):
        self.__search_element__()
        return self

    # Attempts to get a specific attribute value from locator
    # Returns None if attribute not found
    def get_attribute(self, attribute):
        if self.__search_element__():
            return self.element.get_attribute(attribute)
        return None

    # Attempts to get the text content of an element
    # Returns None if element has no text content
    def get_text(self):
        return self.get_attribute("textContent")

    """---------------- Action Functions ----------------"""

    def click(self):
        self.__perform__(self.move_to_click, "Clicking...")
        return self

    def double_click(self):
        self.__perform__(self.move_to_double_click, "Double clicking...")
        return self

    def enter_text(self, text):
        self.__perform__(self.enter_input_text, "Entering text...", text)
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

    def wait_click(self):
        print("Waiting for item to be clickable...")
        self.wait_to_click(self.locator_type, self.locator)
        return self
