import time
from Actions import Actions
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains


class LoadVariablesPopUp(Actions):

    _slider_class = "slider-handles-vcdat"
    _slider_track_class = "slider-tracks-vcdat"
    _slider_handle_class = "slider-handles-vcdat"

    _var_loader_main_class = "varloader-main-vcdat"
    _var_row_class = "varcard-main-vcdat"
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
        locates all rows of variable, and return the elements.
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
        returns the row element and the axes button for the specified 'var'
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
        try:
            row_for_var, element = self.locate_variable_axis(var)
            time.sleep(self._delay)
            self.move_to_click(element)
        except NoSuchElementException as e:
            print("Could not click on axes for var: {}".format(var))
            raise e

    def click_on_load(self):
        print("...click_on_load...")
        locator = "//button[contains(@class, '{}')]".format(self._load_button_class)
        try:
            load_button = self.find_element_by_xpath(locator, "'Load' button")
            self.move_to_click(load_button)
        except NoSuchElementException as e:
            print("Cannot find 'Load' button in the 'Load Variables' pop up")
            raise e

    def locate_all_axes_for_variable(self, var):

        row_for_var, axes_button = self.locate_variable_axis(var)

        # axis_locator = ".//div[@class='collapse']/div[@style='margin-top']"
        axes_class = "dimension-slider-vcdat"
        axis_locator = ".//div[contains(@class, '{}')]".format(axes_class)
        print("DEBUG...axis_locator: {}".format(axis_locator))
        try:
            axis = row_for_var.find_elements_by_xpath(axis_locator)
            print("DEBUG xxx...number of axis for variable '{v}': {n}".format(v=var,
                                                                              n=len(axis)))
            return axis
        except NoSuchElementException as e:
            print("Cannot find all axis for variable '{}'".format(var))
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

    def adjust_var_axes_sliderPREV(self, var, axis, min_offset_percent, max_offset_percent):
        print("...adjust_var_axes_slider...")

        try:
            var_rows = self.find_element_by_class("card-body", 'variable rows')
        except NoSuchElementException as e:
            print("Cannot find variable rows")
            raise e

        i = 0
        for r in var_rows:
            var_locator = "//button[contains(@class, self._var_name_class)]"
            var_button = self.find_element_by_xpath(var_locator,
                                                    "'{}' class".format(self._var_name_class))
            if var_button.text == var:
                print("FOUND the row for variable '{}'".format(var))

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
                slider_track_locator = ".//div[@class='{}']/div".format(self._slider_track_class)
                slider_track = the_axis.find_element_by_xpath(slider_track_locator)
                slider_width = slider_track.size['width']

                print("...info...width of slider_track: {w}".format(w=slider_width))
                # get the slider handle elements - this is the min and max handles
                slider_handle_locator = ".//div[@class='{}']/div[@role='slider']".format(self._slider_handle_class)
                min_max_elements = the_axis.find_elements_by_xpath(slider_handle_locator)
                if min_offset_percent != 0:
                    min_offset = (min_offset_percent/100) * slider_width
                    # needed to work with firefox
                    self.driver.execute_script("return arguments[0].scrollIntoView(true);", min_max_elements[0])
                    ac = ActionChains(self.driver)
                    ac.click_and_hold(min_max_elements[0]).move_by_offset(min_offset, 0).release().perform()
                    time.sleep(self._delay)
                if max_offset_percent != 0:
                    max_offset = (max_offset_percent/100) * slider_width
                    # needed to work with firefox
                    self.driver.execute_script("return arguments[0].scrollIntoView(true);", min_max_elements[1])
                    ac = ActionChains(self.driver)
                    ac.click_and_hold(min_max_elements[1]).move_by_offset(max_offset, 0).release().perform()
                    time.sleep(self._delay)
                break
            i += 1
