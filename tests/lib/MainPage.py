import time

from BasePage import BasePage
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys


class MainPage(BasePage):

    def __init__(self, driver, server):
        super(MainPage, self).__init__(driver, server)

    def _validate_page(self):
        # validate Main page is displaying a 'Home' tab
        print("...MainPage.validatePage()")
        logo_locator = 'jp-MainLogo'
        self.driver.find_element_by_id(logo_locator)

    def _find_tab(self, tab_name):
        '''
        find the tab element ('File', 'Edit', 'View', 'Run'...) and
        return the element
        '''
        tabs_locator = "//ul[@class='p-MenuBar-content']/li"
        tabs_elements = self.driver.find_elements_by_xpath(tabs_locator)
        tab_label_locator = ".//div[@class='p-MenuBar-itemLabel']"
        for tab_element in tabs_elements:
            tab_label_element = tab_element.find_element_by_xpath(tab_label_locator)
            if tab_label_element.text == tab_name:
                return tab_label_element

    def _find_menu_item_from_tab_drop_down_and_click(self, menu_item_name):
        '''
        find the specified menu item from the tab drop down, and
        click on it.
        '''
        menu_items_locator = "//ul[@class='p-Menu-content']/li"
        menu_items_elements = self.driver.find_elements_by_xpath(menu_items_locator)
        item_label_locator = "./div[@class='p-Menu-itemLabel']"
        index = 0
        for m in menu_items_elements:
            item_label_element = m.find_element_by_xpath(item_label_locator)
            if menu_item_name in item_label_element.text:
                break
            index += 1

        menu_item = menu_items_elements[index]
        print("Going to click on '{n}'".format(n=menu_item_name))
        action_chains = ActionChains(self.driver)
        action_chains.move_to_element(menu_item)
        time.sleep(self._delay)
        action_chains.click(menu_item).perform()
        time.sleep(self._delay * 2)

    def click_on_file_tab(self):
        print("...click on 'File' tab...")
        file_tab_element = self._find_tab('File')
        file_tab_element.click()
        time.sleep(self._delay)

    def new_notebook(self):
        '''
        Create a new notebook
        '''
        print("...new_notebook() - create a new notebook")
        self.click_on_file_tab()
        self._find_menu_item_from_tab_drop_down_and_click('New')

        notebook_locator = "//li[@class='p-Menu-item'][@data-command='notebook:create-new']"
        notebook_element = None
        try:
            notebook_element = self.driver.find_element_by_xpath(notebook_locator)
            print("....found 'Notebook' in the popup...")
        except NoSuchElementException:
            print("NOT Finding 'Notebook' element")

        print("Going to click on 'Notebook'...to create a notebook")
        action_chains1 = ActionChains(self.driver)
        action_chains1.move_to_element(notebook_element)
        action_chains1.click(notebook_element).perform()
        time.sleep(self._delay)

    def click_on_load_variables(self):
        load_variables_locator = "//button[@class='btn btn-info'][contains(text(), 'Load Variable(s)')]"
        load_variables_element = self.driver.find_element_by_xpath(load_variables_locator)
        load_variables_element.click()
        time.sleep(self._delay)

    def select_kernel(self):
        """
        can call this method when you get the "Select Kernel" pop up
        """
        select_kernel_popup_locator = "//span[contains(text(), 'Select Kernel')]"
        kernel_select_button_locator = "//button//div[contains(text(), 'SELECT')]"

        print("...looking for the 'Select Kernel' pop up")
        time.sleep(self._delay)
        self.driver.find_element_by_xpath(select_kernel_popup_locator)

        print("...FOUND 'Select Kernel' pop up")
        time.sleep(self._delay)

        print("...click on SELECT button")
        self.find_element_and_click(kernel_select_button_locator, "Kernel Select button")
        time.sleep(self._delay)

    def shutdown_kernel(self):
        kernel_tab_locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), 'Kernel')]"
        kernel_tab_element = self.driver.find_element_by_xpath(kernel_tab_locator)
        shutdown_kernel_locator = "//li[@class='p-Menu-item'][@data-command='kernelmenu:shutdown']"
        print("FOUND 'Kernel' tab")
        if kernel_tab_element.is_displayed() and kernel_tab_element.is_enabled():
            kernel_tab_element.click()
            print("...check if need to shut down kernel...")
            try:
                shutdown_kernel_element = self.driver.find_element_by_xpath(shutdown_kernel_locator)
                if shutdown_kernel_element.is_displayed() and shutdown_kernel_element.is_enabled():
                    print("...shut down kernel...")
                    shutdown_kernel_element.click()
                    time.sleep(self._delay)
                else:
                    print("'Shutdown Kernel' is not clickable")
            except NoSuchElementException:
                print("No need to shutdown kernel")

    def rename_notebook(self, new_nb_name):
        # look for the 'Rename Notebook...' under File tab menu
        self.click_on_file_tab()
        self._find_menu_item_from_tab_drop_down_and_click('Rename')

        # enter the new notebook name
        rename_notebook_input_locator = "//input[@class='jp-mod-styled']"
        input_area = self.driver.find_element_by_xpath(rename_notebook_input_locator)

        # click on the input area
        input_area.clear()
        ActionChains(self.driver).click(input_area).perform()
        a = ActionChains(self.driver)
        a.send_keys(new_nb_name).key_down(Keys.ENTER)
        a.perform()
        time.sleep(self._delay * 2)

    def close_current_notebook(self):
        self.click_on_file_tab()
        self._find_menu_item_from_tab_drop_down_and_click('Close Notebook')

        # check if we are getting "Close without saving?" pop up
        close_without_saving_ok_locator = "//div[contains(text(), 'OK')]"
        try:
            ok_element = self.driver.find_element_by_xpath(close_without_saving_ok_locator)
            print("FOUND 'Close without saving?' pop up, click 'OK'")
            ok_element.click()
            time.sleep(self._delay)
        except NoSuchElementException:
            print("No 'Close without saving?' pop up")
