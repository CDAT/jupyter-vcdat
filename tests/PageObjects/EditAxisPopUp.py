import time

from ActionsPage import ActionsPage
from EditAxis import EditAxis

from selenium.common.exceptions import NoSuchElementException


class EditAxisPopUp(ActionsPage):

    def __init__(self, driver, server):
        super(EditAxisPopUp, self).__init__(driver, server)
        self.edit_axis = EditAxis(driver, None)

    def _validate_page(self):
        edit_axis_locator = "//div[@class='modal-header']/h5[contains(text(), 'Edit')]"
        # edit_axis_locator = "varcard-axes-btn-vcdat"
        print("...EditAxisPopUp.validate_page()...")
        try:
            self.find_element_by_class(edit_axis_locator, "'Edit Variable' header")
            # self.find_element_by_xpath(edit_axis_locator, "'Edit' header")
        except NoSuchElementException as e:
            print("Not finding 'Edit Axis' pop up")
            raise e

    def adjust_var_axes_slider(self, var, axis_title, min_offset_percent, max_offset_percent):
        self.edit_axis.adjust_var_axes_slider(var, axis_title,
                                              min_offset_percent, max_offset_percent)

    def click_on_update(self):
        print("...click on 'Update' button on the 'Edit Axis' pop up")
        update_class = "varmini-update-btn-vcdat"
        try:
            update_button = self.find_element_by_class(update_class,
                                                       "'Update' button on 'Edit Axis' pop up")
            self.move_to_click(update_button)
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("FAIL...EditAxisPopUp.click_on_update")
            raise e
