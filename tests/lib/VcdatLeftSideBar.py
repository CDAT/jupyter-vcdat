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

class VcdatLeftSideBar(BasePage):

    _jp_vcdat_icon_locator = "//ul[@class='p-TabBar-content']//li[@data-id='vcdat-left-side-bar']//div[@class='p-TabBar-tabIcon jp-vcdat-icon jp-SideBar-tabIcon']"
    _variable_options_locator = "//div[@id='vcdat-left-side-bar']//h5[contains(text(), 'Variable Options')]"
    _load_variables_locator = "//div[@id='vcdat-left-side-bar']//button[@class='btn btn-info'][contains(text(), 'Load Variables')]"

    def __init__(self, driver, server=None):
        super(VcdatLeftSideBar, self).__init__(driver, server)

    def _validate_page(self):
        print("...VcdatLeftSideBar.validate_page()...NO OP NOW")
        #self.driver.find_element_by_xpath(self._variable_options_locator)
        #time.sleep(self._delay)
        print("...returning from validate_page...")

    def click_on_jp_vcdat_icon(self):
        
        found_load_variables_element = False
        while found_load_variables_element is False:
            print("...click_on_jp_vcdat_icon...")
            jp_vcdat_icon_element = self.driver.find_element_by_xpath(self._jp_vcdat_icon_locator)
            jp_vcdat_icon_element.click()
            time.sleep(self._delay)
            try:
                load_variables_element = self.driver.find_element_by_xpath(self._load_variables_locator)
                if load_variables_element.is_displayed():
                    print("...XXX XXX FOUND 'Load Variables' button XXX")
                    found_load_variables_element = True
                else:
                    print("...'Load Variables' button is not displayed")
            except NoSuchElementException:
                print("...not seeing Load Variables button..")

    def click_on_load_variables(self):
        print("...click_on_load_variables...")
        load_variables_element = self.driver.find_element_by_xpath(self._load_variables_locator)
        #load_variables_element.click()

        actionChains = ActionChains(self.driver)
        actionChains.move_to_element(load_variables_element)
        print("...going to click on the load variables element")
        actionChains.click(load_variables_element)
        print("...going to perform...")
        actionChains.perform()

        time.sleep(self._delay)

    def click_on_plot(self):
        print("...click on 'Plot' button...")
        plot_button_locator = "//button[contains(text(), 'Plot')]"
        self.find_element_and_click(plot_button_locator, "'Plot' button")
        time.sleep(self._delay)
