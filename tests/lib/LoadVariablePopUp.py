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

    def _get_var_row_elements(self):
        var_rows_locator = "//div[@id='var-loader-modal']//div[@class='modal-content']//div[@class='modal-body']/div"
        try:
            var_row_elements = self.driver.find_elements_by_xpath(var_rows_locator)
            print("DEBUG DEBUG...# of var_row_elements: {n}".format(n=len(var_row_elements)))
        except NoSuchElementException as e:
            print("NOT finding any variables button...")
            raise e
        return var_row_elements

    def click_on_var(self, var):
        print("...click_on_var...var: {v}".format(v=var))

        var_row_elements = self._get_var_row_elements()
        found_button = False
        for r in var_row_elements:
            var_axes_row_locator = ".//button"
            buttons = self.driver.find_elements_by_xpath(var_axes_row_locator)
            for b in buttons:
                if b.text == var:
                    b.click()
                    found_button = True
                    break
            if found_button:
                break

    def click_on_var_axes(self, var):
        print("...click_on_var_axes...var: {v}".format(v=var))

        var_row_elements = self._get_var_row_elements()
        print("XXX XXX # of var_row_elements: {n}".format(n=len(var_row_elements)))
        found_button = False
        for r in var_row_elements:
            var_axes_row_locator = ".//div[starts-with(@class, 'col-sm')]//button"
            buttons = r.find_elements_by_xpath(var_axes_row_locator)
            print("XXX XXX # of buttons: {n}".format(n=len(buttons)))
            for b in buttons:
                print("xxx b.text: {t}".format(t=b.text))
                if b.text == var:
                    found_button = True
                    actionChains = ActionChains(self.driver)
                    print("...going to click on 'Axes' button for variable '{v}'".format(v=var))
                    actionChains.click(buttons[1]).perform()
                    break

        time.sleep(self._delay)

    def adjust_var_axes_slider(self, var, axis, min_or_max, val):
        print("...adjust_var_axes_slider, var: {v}, axis:{a}, min_or_max: {m}, val: {val}".format(v=var,
                                                                                                  a=axis,
                                                                                                  m=min_or_max,
                                                                                                  val=val))
        var_row_elements = self._get_var_row_elements()
        print("XXX XXX # of var_row_elements: {n}".format(n=len(var_row_elements)))
        found_button = False
        for r in var_row_elements:
            var_axes_row_locator = ".//div[starts-with(@class, 'col-sm')]//button"
            buttons = r.find_elements_by_xpath(var_axes_row_locator)
            print("XXX XXX # of buttons: {n}".format(n=len(buttons)))
            for b in buttons:
                print("xxx b.text: {t}".format(t=b.text))
                if b.text == var:
                    var_axes_locator = ".//div[@class='collapse show']/div"
                    var_axes_elements = r.find_elements_by_xpath(var_axes_locator)
                    # number of var_axes_elements should be the number of sliders
                    print("DEBUG....number of var_axes_elements: {n}".format(n=len(var_axes_elements)))
                    # find the axis to be modified.
                    axis_locator = ".//div[@class='row']/div[@class='col-auto']"
                    for axis in var_axes_elements:
                        axis_title_elements = axis.find_elements_by_xpath(axis_locator)
                        for axis_title in axis_title_elements:
                            print("axis_title: {t}".format(t=axis_title.text))
                        

    def load(self):
        print("click on load button...")

        load_button_locator = "//div[@class='modal-footer']//button[contains(text(), 'Load')]"
        self.find_element_and_click(load_button_locator, "...click on 'Load' button...")
        time.sleep(self._delay)
