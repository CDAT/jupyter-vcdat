import time

from BasePage import BasePage
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class FileBrowser(BasePage):

    _file_name_header_locator = "//span[@class='jp-DirListing-headerItemText'][contains(text(), 'Name')]"

    # probably temporary
    _file_load_error_ok_locator = "//button[@class='jp-Dialog-button jp-mod-accept jp-mod-styled']"

    def __init__(self, driver, server):
        super(FileBrowser, self).__init__(driver, server)

    def _validate_page(self):
        print("...FileBrowser.validate_page()...")
        self.driver.find_element_by_xpath(self._file_name_header_locator)

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

        print("...click on the File Load Error for clt.nc OK button")
        print("...doing WebDriverWait...till the element is clickable")
        wait = WebDriverWait(self.driver, 10)
        load_el = wait.until(EC.element_to_be_clickable((By.XPATH,
                                                         self._file_load_error_ok_locator)))
        print("FOUND file_load_error_ok element...")
        load_el.click()
        time.sleep(self._delay * 2)
