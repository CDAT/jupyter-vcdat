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
        self.driver.find_element_by_xpath(load_variable_locator)

    def click_on_var_PREV(self, var):
        print("...click_on_var...var: {v}".format(v=var))
        var_locator = "//button[contains(text(), '{v}')]".format(v=var)
        self.find_element_and_click(var_locator, 
                                    "Variable '{v}' button".format(v=var))
        # assert that button is selected
        var_selected_locator = "//button[@class='btn btn-outline-success active'][contains(text(), '{v}')]".format(v=var)
        self.find_element(var_selected_locator, "Var {v} button selected".format(v=var))

    def click_on_var(self, var):
        print("...click_on_var...var: {v}".format(v=var))

        buttons_locator = "//div[@class='modal-body']//div[@class='card']//button"
        try:
            button_elements = self.driver.find_elements_by_xpath(buttons_locator)
        except NoSuchElementException as e:
            print("NOT finding any variables button...")
            raise e

        for b in button_elements:
            #var_button_locator = ".//button[contains(text(), '{v}')]".format(v=var)
            if b.text == var:
                b.click()
                break

            #print("DEBUG...button, {v}".format(v=var_button_element.text))
            #if var_button_element.text == var:
            #    print("FOUND button {v}, and clicking it".format(v=var_button_element.text))
            #    #b.click()
            #    action_chains = ActionChains(self.driver)
            #    action_chains.click(var_button_element).perform()
            #    time.sleep(5)

        # assert that button is selected

    def load(self):
        print("click on load button...")

        load_button_locator = "//div[@class='modal-footer']//button[contains(text(), 'Load')]"
        self.find_element_and_click(load_button_locator, "...click on 'Load' button...")
        time.sleep(5)
