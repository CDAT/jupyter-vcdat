import time
from Actions import Actions
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains


class EditAxis(Actions):

    def __init__(self, driver, server):
        super(EditAxis, self).__init__(driver, server)

    def locate_all_axes_for_variable(self, var):
        axes_class = "dimension-slider-vcdat"
        try:
            axes = self.find_elements_by_class(axes_class,
                                               "axes for variable")
            print("...number of axis for variable '{v}': {n}".format(v=var,
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
            axis_title_locator = ".//div[@class='row']//div[@class='col-auto']"
            try:
                axis_titles_for_var = axis.find_elements_by_xpath(axis_title_locator)
                print("number of axis_titles_for_var: {}".format(len(axis_titles_for_var)))
                print("...axis_title: {}".format(axis_titles_for_var[0].text))
                for at in axis_titles_for_var:
                    print("axis title: '{}'".format(at.text))

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
            return slider_width
        except NoSuchElementException as e:
            print("Cannot find slider track")
            raise e

    def _get_slider_controls(self, axis_element):
        slider_controls_locator = ".//div[@class='slider-handles-vcdat']/div"
        try:
            slider_controls = axis_element.find_elements_by_xpath(slider_controls_locator)
            return slider_controls
        except NoSuchElementException as e:
            print("Cannot get slider controls")
            raise e

    def _adjust_slider_control(self, slider_control_element, slider_width, offset_percent):
        print("...slider_width: {w}, offset_percent: {op}".format(w=slider_width,
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
            print("FOUND axis_for_var")
            slider_width = self._get_slider_width_for_axis(axis_for_var)

            slider_controls = self._get_slider_controls(axis_for_var)
            self._adjust_slider_control(slider_controls[0], slider_width, min_offset_percent)
            self._adjust_slider_control(slider_controls[1], slider_width, max_offset_percent)
            time.sleep(self._delay * 2)
        except NoSuchElementException as e:
            print("FAIL...adjust_var_axes_slider")
            raise e
