import time

from BasePage import BasePage
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys


class NoteBookPage(BasePage):

    def __init__(self, driver, server=None):
        super(NoteBookPage, self).__init__(driver, server)

    def _validate_page(self):
        print("...NoteBookPage.validatePage()")

    def close(self):
        print("...closing a note book if there is any...")
        nb_locator = "//div[@class='p-TabBar-tabIcon jp-NotebookIcon']"
        try:
            self.driver.find_element_by_xpath(nb_locator)
            print("FOUND a notebook")
        except NoSuchElementException:
            print("NOT FINDING a notebook")
            return

        nb_divs = "//li[contains(@title, 'Name: Untitled')]//div[starts-with(@class, 'p-TabBar')]"
        try:
            elems = self.driver.find_elements_by_xpath(nb_divs)
            for e in elems:
                attr = e.get_attribute("class")
                if e.is_displayed() and e.is_enabled() and attr == 'p-TabBar-tabCloseIcon':
                    print("...click on note book close icon..., attr: {a}".format(a=attr))
                    action_chains = ActionChains(self.driver)
                    action_chains.move_to_element(e)
                    action_chains.click(e).perform()
                    time.sleep(self._delay)

        except NoSuchElementException:
            print("Not finding divs")
            print("No notebook")

        # check if we are getting "Close without saving?" pop up
        close_without_saving_ok_locator = "//div[contains(text(), 'OK')]"
        try:
            ok_element = self.driver.find_element_by_xpath(close_without_saving_ok_locator)
            print("FOUND 'Close without saving?' pop up")
            ok_element.click()
        except NoSuchElementException:
            print("No 'Close without saving?' pop up")

    def load_page(self, server, expected_element=(By.TAG_NAME, 'html'),
                  timeout=3):
        print("...NoteBookPage.load_page()...do nothing")

    def enter_code(self, code_text):

        nb_code_area_locator1 = "//div[@class='CodeMirror-code' and @role='presentation']"
        nb_code_area_locator2 = "//pre[@class=' CodeMirror-line ']"
        nb_code_area_locator3 = "//span[@role='presentation']//span[@cm-text='']"
        locator = "{l1}{l2}{l3}".format(l1=nb_code_area_locator1,
                                        l2=nb_code_area_locator2,
                                        l3=nb_code_area_locator3)
        code_area_element = self.driver.find_element_by_xpath(locator)

        ActionChains(self.driver).click(code_area_element).perform()
        a = ActionChains(self.driver)
        a.send_keys(code_text).key_down(Keys.SHIFT).send_keys(Keys.ENTER).key_up(Keys.SHIFT)
        a.perform()
        time.sleep(self._delay)

        print("xxx after entering: {c}".format(c=code_text))
