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

class MainPage(BasePage):

    _kernel_tab_locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), 'Kernel')]"

    def __init__(self, driver, server):
        super(MainPage, self).__init__(driver, server)
        #self.load_page(server)

    def _validate_page(self):
        # validate Main page is displaying a 'Home' tab
        print("...MainPage.validatePage()")
        logo_locator = 'jp-MainLogo'
        logo_element = self.driver.find_element_by_id(logo_locator)

    def click_on_load_variables(self):
        load_variables_locator = "//button[@class='btn btn-info'][contains(text(), 'Load Variables')]"
        load_variables_element = self.driver.find_element_by_xpath(load_variables_locator)
        print("FOUND element")
        load_variables_element.click()
        time.sleep(self._delay)

    def shutdown_kernel(self):
        kernel_tab_element = self.driver.find_element_by_xpath(self._kernel_tab_locator)
        shutdown_kernel_element = "//div[contains(text(), 'Shutdown Kernel')]"
        
        print("FOUND 'Kernel' tab")
        kernel_tab_element.click()
        print("...shut down kernel...")
        self.driver.find_element_by_xpath(shutdown_kernel_element).click()
        time.sleep(5)
        
