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

class LoadVariablePopUp(BasePage):

    def __init__(self, driver, server=None):
        super(LoadVariablePopUp, self).__init__(driver, server)

    def _validate_page(self):
        load_variable_locator = "//div[@class='modal-header']//h5[contains(text(), 'Load Variable')]"
        print("...LoadVariablePopUp.validate_page()...")
        self.driver.find_element_by_xpath(self.load_variable_locator)

    def click_on_var(self, var):
        print("...click_on_var...var: {v}".format(v=var))
        var_button_locator = "//button[contains(text(), '{v}')]".format(v=var)

        
