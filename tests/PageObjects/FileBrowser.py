import time
from selenium.webdriver.common.by import By
from ActionsPage import ActionsPage
from LoadVariablesPopUp import LoadVariablesPopUp


class FileBrowser(ActionsPage):

    def __init__(self, driver, server=None):
        super(FileBrowser, self).__init__(driver, server)

    def _validate_page(self):
        print("...FileBrowser.validate_page()...")
        file_name_header_locator = "//span[@class='jp-DirListing-headerItemText'][contains(text(), 'Name')]"
        self.driver.find_element_by_xpath(file_name_header_locator)

    def double_click_on_a_file(self, fname, expect_file_load_error=True):
        file_locator = "//li[@title='{f}']".format(f=fname)
        file_element = self.find_element_by_xpath(file_locator,
                                                  "'{}' file".format(fname))

        self.move_to_double_click(file_element)
        time.sleep(self._delay)

        if expect_file_load_error:
            print("...click on the File Load Error OK button")
            print("...doing WebDriverWait...till the element is clickable")
            file_load_error_ok_locator = "//button[@class='jp-Dialog-button jp-mod-accept jp-mod-styled']"
            self.wait_click(By.XPATH, file_load_error_ok_locator)

        time.sleep(self._delay)
        load_variables_pop_up = LoadVariablesPopUp(self.driver, None)
        return load_variables_pop_up
