import time
from ActionsPage import ActionsPage
from EditAxis import EditAxis

from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException


class LoadVariablesPopUp(ActionsPage):

    _var_loader_items_class = "var-loader-items-vcdat"
    _var_button_class = "varcard-name-btn-vcdat"
    _var_axes_class = "varcard-axes-btn-vcdat"

    _load_button_class = "var-loader-load-btn-vcdat"

    def __init__(self, driver, server):
        super(LoadVariablesPopUp, self).__init__(driver, server)
        self.edit_axis = EditAxis(driver, None)

    def _validate_page(self):
        load_variables_locator = "//div[@class='modal-header']/h5[contains(text(), 'Load Variable')]"
        print("...LoadVariablePopUp.validate_page()...")
        try:
            self.find_element_by_xpath(load_variables_locator, "'Load Variable' header")
        except NoSuchElementException as e:
            print("Not finding 'Load Variable' pop up")
            raise e

    def locate_variable(self, var):
        locator = "//button[contains(@class, '{cl}') and contains(text(), '{var}')]".format(cl=self._var_button_class,
                                                                                            var=var)
        try:
            element = self.find_element_by_xpath(locator, "'{}' button".format(var))
            return element
        except NoSuchElementException as e:
            print("Did not find var: {}".format(var))
            raise e

    def click_on_variable(self, var):
        try:
            element = self.locate_variable(var)
            self.move_to_click(element)
        except NoSuchElementException as e:
            print("Could not click on var: {}".format(var))
            raise e

        # wait till the 'axes' button is visible
        #self.wait_till_element_is_visible(By.CLASS_NAME, self._var_axes_class,
        #                                  "'axes' button for var '{}'".format(var))

    def _locate_all_variable_row_elements(self):
        '''
        locates the rows for variables, and return the elements.
        '''
        rows_locator = "//div[contains(@class, '{}')]/div".format(self._var_loader_items_class)
        print("xxx xxx rows_locator: {}".format(rows_locator))
        try:
            rows = self.find_elements_by_xpath(rows_locator, 'variable rows')
            print("DEBUG DEBUG..._locate_all_variable_row_elements, num of rows: {}".format(len(rows)))
            return rows
        except NoSuchElementException as e:
            print("Did not find elements with {} locator".format(rows_locator))
            raise e

    def locate_variable_axis(self, var):
        '''
        this function should be called only when the variable is already selected.
        returns the row element and the 'axes' button for the specified 'var'
        The row element returned can then be used in the caller to find other
        elements related to this var.
        '''
        time.sleep(2)
        rows = self._locate_all_variable_row_elements()
        print("XXX DEBUG...num of rows: {}".format(len(rows)))

        i = 0
        var_locator = ".//button[contains(@class, '{}')]".format(self._var_button_class)
        axes_locator = ".//button[contains(@class, '{}')]".format(self._var_axes_class)
        for r in rows:
            try:
                var_button = r.find_element_by_xpath(var_locator)
                if var_button.text == var:
                    print("FOUND the '{}' var".format(var))
                    # find the axes button
                    var_axes_button = r.find_element_by_xpath(axes_locator)
                    print("FOUND the axes button for '{}' var".format(var))
                    return r, var_axes_button
                    # break
                else:
                    i += 1
            except NoSuchElementException as e:
                print("Not finding var class '{}'".format(var_locator))
                raise e

        if i >= len(rows):
            # we should not hit this case -- REVISIT - raise an exception
            print("Could not find axes for var '{}'".format(var))

    def click_on_edit_button(self, var):
        loader_items_locator = "//div[@class='var-loader-items-vcdat']/div"
        items = self.find_elements_by_xpath(loader_items_locator, "loader items")
        print("FOUND {n} variables".format(n=len(items)))
        for i in items:
            var_row_locator = ".//div[@class='varcard-main-vcdat']"
            try:
                var_row = i.find_element_by_xpath(var_row_locator)
                try:
                    var_locator = ".//button[contains(@class, '{cl}') and contains(text(), '{var}')]".format(cl=self._var_button_class,
                                                                                                             var=var)
                    var = var_row.find_element_by_xpath(var_locator)
                    print("FOUND...row for variable {v}".format(v=var))
                except NoSuchElementException:
                    print("This is not the row for the variable '{v}' we are looking for.".format(v=var))
                    # we go to the next iteration
                    continue
            except NoSuchElementException as e:
                print("This row does not have 'Edit' button, go to next row")
                continue

            edit_button_locator = ".//button[contains(text(), 'Edit')]"
            try:
                edit_button = var_row.find_element_by_xpath(edit_button_locator)
                self.move_to_click(edit_button)
            except NoSuchElementException as e:
                print("FAIL...could not find 'Edit' button for variable '{v}'".format(v=var))
                raise e

    def click_on_variable_axes(self, var):
        """
        click on "axes" button for the specified variable.
        """
        try:
            row_for_var, element = self.locate_variable_axis(var)
            time.sleep(self._delay)
            self.move_to_click(element)
            time.sleep(self._delay * 2)
        except NoSuchElementException as e:
            print("Could not click on axes for var: {}".format(var))
            raise e

        axes_class = "dimension-slider-vcdat"
        self.wait_till_element_is_visible(By.CLASS_NAME, axes_class,
                                          "dimension slider")

    def click_on_load(self):
        """
        click on 'Load' button
        """
        print("...click_on_load...")
        locator = "//button[contains(@class, '{}')]".format(self._load_button_class)
        try:
            load_button = self.find_element_by_xpath(locator, "'Load' button")
            self.scroll_click(load_button)
            # self.move_to_click(load_button)
            # REVISIT -- add checking instead of sleep
            time.sleep(2)
        except NoSuchElementException as e:
            print("Cannot find 'Load' button in the 'Load Variables' pop up")
            raise e

    def locate_axis_with_title(self, var, axis_title):
        self.edit_axis.locate_axis_with_title(var, axis_title)

    def _get_slider_width_for_axis(self, axis_element):
        self.edit_axis._get_slider_width_for_axis

    def _get_slider_controls(self, axis_element):
        self.edit_axis._get_slider_controls(axis_element)

    def _adjust_slider_control(self, slider_control_element, slider_width, offset_percent):
        self.edit_axis._adjust_slider_control(slider_control_element,
                                              slider_width, offset_percent)

    def adjust_var_axes_slider(self, var, axis_title, min_offset_percent, max_offset_percent):
        self.edit_axis.adjust_var_axes_slider(var, axis_title,
                                              min_offset_percent, max_offset_percent)

    def locate_all_axes_for_variable(self, var):
        """
        locate all axes for the specified variable, and return all elements.
        """
        row_for_var, axes_button = self.locate_variable_axis(var)

        # axis_locator = ".//div[@class='collapse']/div[@style='margin-top']"
        axes_class = "dimension-slider-vcdat"
        axes_locator = ".//div[contains(@class, '{}')]".format(axes_class)
        print("DEBUG...axis_locator: {}".format(axes_locator))
        try:
            axes = row_for_var.find_elements_by_xpath(axes_locator)
            print("DEBUG xxx...number of axis for variable '{v}': {n}".format(v=var,
                                                                              n=len(axes)))
            return axes
        except NoSuchElementException as e:
            print("Cannot find all axes for variable '{}'".format(var))
            raise e
