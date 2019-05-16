import time
from ActionsPage import ActionsPage
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains


class LoadVariablesPopUp(ActionsPage):

    _var_loader_main_class = "varloader-main-vcdat"
    _var_button_class = "varcard-name-btn-vcdat"
    _var_axes_class = "varcard-axes-btn-vcdat"

    _load_button_class = "varloader-load-btn-vcdat"

    def __init__(self, driver, server):
        super(LoadVariablesPopUp, self).__init__(driver, server)

    def _validate_page(self):
        load_variables_locator = "//div[@class='modal-header']//h5[contains(text(), 'Load Variable')]"
        print("...LoadVariablePopUp.validate_page()...")
        self.find_element_by_xpath(load_variables_locator, "'Load Variable(s)' header")

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

    def _locate_all_variable_row_elements(self):
        '''
        locates the rows for variables, and return the elements.
        '''
        rows_locator = "//div[contains(@class, '{}')]/div".format(self._var_loader_main_class)
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

    def click_on_variable_axes(self, var):
        """
        click on "axes" button for the specified variable.
        """
        try:
            row_for_var, element = self.locate_variable_axis(var)
            time.sleep(self._delay)
            self.move_to_click(element)
        except NoSuchElementException as e:
            print("Could not click on axes for var: {}".format(var))
            raise e

    def click_on_load(self):
        """
        click on 'Load' button
        """
        print("...click_on_load...")
        locator = "//button[contains(@class, '{}')]".format(self._load_button_class)
        try:
            load_button = self.find_element_by_xpath(locator, "'Load' button")
            self.move_to_click(load_button)
            # REVISIT -- add checking instead of sleep
            time.sleep(1)
        except NoSuchElementException as e:
            print("Cannot find 'Load' button in the 'Load Variables' pop up")
            raise e

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

    def locate_axis_with_title(self, var, axis_title):
        axes_for_var = self.locate_all_axes_for_variable(var)
        print("number of axes for variable '{v}': {n}".format(v=var,
                                                              n=len(axes_for_var)))
        i = 0
        for axis in axes_for_var:
            # check the axis title
            axis_title_locator = ".//div[@class='col-auto']"
            try:
                axis_titles_for_var = axis.find_elements_by_xpath(axis_title_locator)
                print("number of axis_titles_for_var: {}".format(len(axis_titles_for_var)))
                print("DEBUG...axis_title: {t}".format(t=axis_titles_for_var[0].text))
                if axis_titles_for_var[0].text == axis_title:
                    print("FOUND '{a}' axis for variable '{v}'".format(a=axis_title,
                                                                       v=var))
                    break
                else:
                    i += 1
            except NoSuchElementException as e:
                print("Cannot find axis title for variable '{}'".format(var))
                raise e
        if i >= len(axes_for_var):
            # REVISIT -- throw an exception
            print("FAIL...we should not be here...")
        else:
            return axes_for_var[i]

    def _get_slider_width_for_axis(self, axis_element):
        slider_track_locator = ".//div[@class='slider-tracks-vcdat']/div"
        try:
            slider_track = axis_element.find_element_by_xpath(slider_track_locator)
            slider_width = slider_track.size['width']
            print("DEBUG DEBUG....slider_width: '{}'".format(slider_width))
            return slider_width
        except NoSuchElementException as e:
            print("Cannot find slider track")
            raise e

    def _get_slider_controls(self, axis_element):
        slider_controls_locator = ".//div[@class='slider-handles-vcdat']/div"
        try:
            slider_controls = axis_element.find_elements_by_xpath(slider_controls_locator)
            print("DEBUG...num of slider_controls: {}".format(len(slider_controls)))
            return slider_controls
        except NoSuchElementException as e:
            print("Cannot get slider controls")
            raise e

    def _adjust_slider_control(self, slider_control_element, slider_width, offset_percent):
        print("DEBUG...slider_width: {w}, offset_percent: {op}".format(w=slider_width,
                                                                       op=offset_percent))
        offset = (offset_percent / 100) * slider_width
        self.driver.execute_script("return arguments[0].scrollIntoView(true);", slider_control_element)
        ac = ActionChains(self.driver)
        ac.click_and_hold(slider_control_element).move_by_offset(offset, 0).release().perform()
        time.sleep(self._delay)

    def adjust_var_axes_slider(self, var, axis_title, min_offset_percent, max_offset_percent):
        print("...adjust_var_axes_slider...")
        try:
            axis_for_var = self.locate_axis_with_title(var, axis_title)
            print("DEBUG...found axis_for_var")
            slider_width = self._get_slider_width_for_axis(axis_for_var)

            slider_controls = self._get_slider_controls(axis_for_var)
            self._adjust_slider_control(slider_controls[0], slider_width, min_offset_percent)
            self._adjust_slider_control(slider_controls[1], slider_width, max_offset_percent)
        except NoSuchElementException as e:
            print("FAIL...adjust_var_axes_slider")
            raise e
