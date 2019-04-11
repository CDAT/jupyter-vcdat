import time

from BasePage import BasePage
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains


class LoadVariablePopUp(BasePage):

    def __init__(self, driver, server=None):
        super(LoadVariablePopUp, self).__init__(driver, server)

    def _validate_page(self):
        load_variable_locator = "//div[@class='modal-header']//h5[contains(text(), 'Load Variable')]"
        print("...LoadVariablePopUp.validate_page()...")
        self.driver.find_element_by_xpath(load_variable_locator)

    def _get_var_row_elements(self):
        var_rows_locator = "//div[@class='modal-body']/div"
        try:
            var_row_elements = self.driver.find_elements_by_xpath(var_rows_locator)
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
        for r in var_row_elements:
            var_axes_row_locator = ".//div[starts-with(@class, 'col-sm')]//button"
            buttons = r.find_elements_by_xpath(var_axes_row_locator)
            if buttons[0].text == var:
                print("...going to click on 'Axes' button for variable '{v}'".format(v=var))
                buttons[1].click()
                break
        time.sleep(self._delay)

    def adjust_var_axes_slider(self, var, axis, min_offset_percent, max_offset_percent):
        var_row_elements = self._get_var_row_elements()
        print("...# of var_row_elements: {n}".format(n=len(var_row_elements)))
        for r in var_row_elements:
            var_axes_row_locator = ".//div[starts-with(@class, 'col-sm')]//button"
            buttons = r.find_elements_by_xpath(var_axes_row_locator)
            for b in buttons:
                if b.text == var:
                    div_index_for_axis = 0
                    var_axes_locator = ".//div[@class='collapse show']/div"
                    var_axes_elements = r.find_elements_by_xpath(var_axes_locator)
                    # number of var_axes_elements should be the number of sliders
                    # find the axis to be modified.
                    axis_locator = ".//div[@class='row']/div[@class='col-auto']"
                    for an_axis in var_axes_elements:
                        axis_title_elements = an_axis.find_elements_by_xpath(axis_locator)
                        # print("...an axis...{t}".format(t=axis_title_elements[0].text))
                        if axis_title_elements[0].text == axis:
                            print("FOUND the axis to be adjusted...{i}".format(i=div_index_for_axis))
                            break
                        else:
                            div_index_for_axis += 1

                    # index to var_axes_elements
                    the_axis = var_axes_elements[div_index_for_axis]
                    the_axis_title_element = the_axis.find_elements_by_xpath(axis_locator)[0]
                    print("...the_axis_title_element's text: {t}".format(t=the_axis_title_element.text))

                    # get the slider track width
                    slider_track_locator = ".//div[@class='slider-tracks']/div"
                    slider_track = the_axis.find_element_by_xpath(slider_track_locator)
                    slider_width = slider_track.size['width']
                    print("...info...width of slider_track: {w}".format(w=slider_width))
                    # get the slider handle elements - this is the min and max handles
                    slider_handle_locator = ".//div[@class='slider-handles']/div[@role='slider']"
                    min_max_elements = the_axis.find_elements_by_xpath(slider_handle_locator)
                    ac = ActionChains(self.driver)
                    if min_offset_percent != 0:
                        min_offset = (min_offset_percent/100) * slider_width
                        ac.click_and_hold(min_max_elements[0]).move_by_offset(min_offset, 0).release().perform()
                        time.sleep(self._delay)
                    if max_offset_percent != 0:
                        max_offset = (max_offset_percent/100) * slider_width
                        ac.click_and_hold(min_max_elements[1]).move_by_offset(max_offset, 0).release().perform()
                        time.sleep(self._delay)
                    break

    def load(self):
        print("click on load button...")

        load_button_locator = "//div[@class='modal-footer']//button[contains(text(), 'Load')]"
        self.find_element_and_click(load_button_locator, "...click on 'Load' button...")
        time.sleep(self._delay)
