import time

from BasePage import BasePage
from selenium.common.exceptions import NoSuchElementException


class MainPage(BasePage):

    def __init__(self, driver, server):
        super(MainPage, self).__init__(driver, server)

    def _validate_page(self):
        # validate Main page is displaying a 'Home' tab
        logo_locator = 'jp-MainLogo'
        self.driver.find_element_by_id(logo_locator)

    def find_tab(self, tab_name):
        '''
        find the tab element ('File', 'Edit', 'View', 'Run'...) and
        return the element
        '''
        print("...find tab for '{t}'".format(t=tab_name))
        tab_locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), '{n}')]".format(n=tab_name)
        try:
            tab_label_element = self.driver.find_element_by_xpath(tab_locator)
            return tab_label_element
        except NoSuchElementException as e:
            print("...did not find tab for '{t}'".format(t=tab_name))
            raise e

    def find_menu_item_from_tab_drop_down_and_click(self, menu_item_name):
        '''
        find the specified menu item from the tab drop down, and
        click on it.
        '''
        print("...find '{m}' from drop down menu".format(m=menu_item_name))
        menu_item_locator = "//div[@class='p-Menu-itemLabel'][contains(text(), '{n}')]".format(n=menu_item_name)
        try:
            m = self.driver.find_element_by_xpath(menu_item_locator)
            if m.is_displayed() and m.is_enabled():
                m.click()
                time.sleep(self._delay)
        except NoSuchElementException as e:
            print("Did not find '{m}' from the drop down menu".format(m=menu_item_name))
            raise e

    def find_menu_item_by_constraint_and_click(self, constraint):
        '''
        find the menu item with the specified constraint from the tab
        drop down, and click on it.
        '''
        menu_item_locator = "//li[@class='p-Menu-item'][{c}]".format(c=constraint)
        try:
            m = self.driver.find_element_by_xpath(menu_item_locator)
            if m.is_displayed() and m.is_enabled():
                m.click()
                time.sleep(self._delay)
        except NoSuchElementException as e:
            print("Did not find menu item with '{c}' constraint".format(c=constraint))
            raise e

    def click_on_file_tab(self):
        print("...click on 'File' tab...")
        file_tab_element = self.find_tab('File')
        file_tab_element.click()
        time.sleep(self._delay)

    def select_kernel(self):
        """
        can call this method when you get the "Select Kernel" pop up
        """
        select_kernel_popup_locator = "//span[contains(text(), 'Select Kernel')]"
        kernel_select_button_locator = "//button//div[contains(text(), 'SELECT')]"

        print("...click on 'SELECT' in the 'Select Kernel' pop up")
        try:
            self.driver.find_element_by_xpath(select_kernel_popup_locator)
            time.sleep(self._delay)

            self.find_element_and_click(kernel_select_button_locator, "Kernel Select button")
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("did not find 'Select Kernel' pop up")
            raise e

    def shutdown_kernel(self):
        print("...shutdown kernel if need to...")
        kernel_tab_element = self.find_tab('Kernel')
        kernel_tab_element.click()
        try:
            shutdown_kernel_locator_contraint = "@data-command='kernelmenu:shutdown'"
            self.find_menu_item_by_constraint_and_click(shutdown_kernel_locator_contraint)
        except NoSuchElementException:
            print("No need to shutdown kernel")
