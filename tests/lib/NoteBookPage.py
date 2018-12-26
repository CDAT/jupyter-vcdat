import time

from BasePage import BasePage
from BasePage import InvalidPageException

from selenium.common.exceptions import NoSuchElementException

from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.keys import Keys

class NoteBookPage(BasePage):

    _wait_timeout = 10
    _nb_tab_locator = "//div[@class='p-TabBar-tabLabel' and contains(text(), 'Untitled.ipynb')]" 
    _nb_code_area_locator = "//div[@class='CodeMirror-code' and @role='presentation']//pre[@class=' CodeMirror-line ']//span[@role='presentation']//span[@cm-text='']"
    
    def __init__(self, driver, server):
        print("xxxxxx NoteBookPage.__init__ xxx")
        super(NoteBookPage, self).__init__(driver, server)

    def _validate_page(self):
        # validate Main page is displaying a 'Home' tab
        print("...NoteBookPage.validatePage()")
        nb_tab_element = self.driver.find_element_by_xpath(self._nb_tab_locator)


    def load_page(self, server, expected_element=(By.TAG_NAME, 'html'), 
                  timeout=_wait_timeout):
        print("...NoteBookPage.load_page()...do nothing")

    def enter_code(self, code_text):

        code_area_element = self.driver.find_element_by_xpath(self._nb_code_area_locator)

        ActionChains(self.driver).click(code_area_element).perform()
        a = ActionChains(self.driver)
        a.send_keys(code_text).key_down(Keys.SHIFT).send_keys(Keys.ENTER).key_up(Keys.SHIFT)
        a.perform()
        time.sleep(10)

        print("xxx after entering: {c}".format(c=code_text))
