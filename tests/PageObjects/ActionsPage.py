import time
from abc import abstractmethod
from typing import Optional, Callable, Any
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from Actions import Action, Actions
from Locator import Locator
from typing import Any, Callable, List, Optional, Union


class ActionsPage(Actions):

    _wait_timeout = 10

    def __init__(self, driver: object, server: object) -> None:
        super(ActionsPage, self).__init__(driver, server)
        if server:
            self.load_page(server)
        self._validate_page()

    @abstractmethod
    def _validate_page(self) -> None:
        return

    def load_page(
        self, server: object, expected_element: tuple = (By.TAG_NAME, "html"), timeout: int = _wait_timeout
    ) -> None:
        url = server
        print("...load_page, url: {u}".format(u=url))
        try:
            self.driver.get(url)
        except TimeoutException:
            assert False, "Page not found or timeout for {0}".format(url)
        element = EC.presence_of_element_located(expected_element)
        try:
            WebDriverWait(self.driver, timeout).until(element)
        except TimeoutException:
            assert False, "Page not found or timeout  for {0}".format(url)
        time.sleep(self._delay)

    # Creates a locator object (single element) with the driver added
    def locator(self, loc: str, loc_type: str, descr: str = "", req: List[Optional[Union[Action, Locator]]] = None) -> Locator:
        return Locator(self.driver, loc, loc_type, descr, False, req)

    # Creates locators object (multiple elements) with the driver added
    def locators(self, loc: str, loc_type: str, descr: str = "", req: Optional[Union[Action, Locator]] = None) -> List[Locator]:
        return Locator(self.driver, loc, loc_type, descr, True, req)

    # Creates an action object
    def action(self, action: Callable[..., Any], descr: str, *args: Any) -> Action:
        return Action(action, descr, True, *args)


class InvalidPageException(Exception):
    """ Throw this exception when we do not find the correct page """

    pass
