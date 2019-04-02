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

class FileBrowser(BasePage):

    _file_name_header_locator = "//span[@class='jp-DirListing-headerItemText'][contains(text(), 'Name')]"

    # probably temporary
    _file_load_error_ok_locator = "//button[@class='jp-Dialog-button jp-mod-accept jp-mod-styled']"

    def __init__(self, driver, server):
        super(FileBrowser, self).__init__(driver, server)

    def _validate_page(self):
        print("...FileBrowser.validate_page()...")
        self.driver.find_element_by_xpath(self._file_name_header_locator)

    def select_kernel(self):
        """
        can call this method when you get the "Select Kernel" pop up
        """
        
        # select_kernel_popup_locator = "//div[@class='p-Widget jp-Dialog']//div[@class='p-Widget p-Panel jp-Dialog-content']//span[contains(text(), 'Select Kernel')]"
        select_kernel_popup_locator = "//span[contains(text(), 'Select Kernel')]"
        select_kernel_drop_down_locator = "//select[@class='jp-mod-styled']"
        kernel = "Python 3"
        kernel_locator = "//option[contains(text(), '{k}')]".format(k=kernel)
        kernel_select_button_locator = "//button//div[contains(text(), 'SELECT')]"

        print("...looking for the 'Select Kernel' pop up")
        self.driver.find_element_by_xpath(select_kernel_popup_locator)
        print("...FOUND 'Select Kernel' pop up")
        time.sleep(self._delay)

        # click on the drop down arrow
        # self.driver.find_element_by_xpath(select_kernel_drop_down_locator).click()
        self.find_element_and_click(select_kernel_drop_down_locator, "kernel drop down list")
        time.sleep(self._delay)

        self.find_element_and_click(kernel_locator, "Kernel {k}".format(k=kernel))
        time.sleep(self._delay)

        # click on the 'SELECT' button
        print("...click on SELECT button")
        self.find_element_and_click(kernel_select_button_locator, "Kernel Select button")
        time.sleep(self._delay)


    def double_click_on_a_file(self, fname):
        file_locator = "//span[@class='jp-DirListing-itemText'][contains(text(), '{f}')]".format(f=fname)
        file_element = self.driver.find_element_by_xpath(file_locator)
        print("...found file_element for {f}".format(f=fname))

        actionChains = ActionChains(self.driver)
        actionChains.move_to_element(file_element)
        print("...going to double click on the file name")
        actionChains.double_click(file_element)
        print("...going to perform...")
        actionChains.perform()

        print("...click on the File Load Error for clt.nc OK button -- is this TEMPORARY?")
        print("...doing WebDriverWait...till the element is clickable")
        load_el = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, self._file_load_error_ok_locator)))
        print("FOUND file_load_error_ok element...")
        load_el.click()
        time.sleep(self._delay)

        self.select_kernel()
