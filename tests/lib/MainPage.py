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

class MainPage(BasePage):

    # TEMPORARY -- should be in config
    _kernel = "Python 3"

    #_logo_locator = "//div[@id='jp-MainLogo']"
    _logo_locator = 'jp-MainLogo'
    _file_folder_locator = "//li[@title='File Browser']"
    _temp_select_popup_locator = "//div[@class='p-Widget p-Panel jp-Dialog-content']"
    # _select_kernel_popup_locator = "//div[@class='p-Widget p-Panel jp-Dialog-content']//span[contains(text(), 'Select Kernel')]"
    _select_kernel_popup_locator = "//div[@class='p-Widget jp-Dialog']//div[@class='p-Widget p-Panel jp-Dialog-content']//span[contains(text(), 'Select Kernel')]"
    _select_kernel_drop_down_locator = "//select[@class='jp-mod-styled']"
    _kernel_locator = "//option[contains(text(), '{k}')]".format(k=_kernel)
    _kernel_select_button_locator = "//button//div[contains(text(), 'SELECT')]"
    _file_load_error_ok_locator = "//button[@class='jp-Dialog-button jp-mod-accept jp-mod-styled']"
    #_file_load_error_ok_locator = "//button[@class='jp-Dialog-button jp-mod-accept jp-mod-styled']//div[@class='jp-Dialog-buttonIcon']"

    def __init__(self, driver, server):
        super(MainPage, self).__init__(driver, server)
        #self.load_page(server)

    def _validate_page(self):
        # validate Main page is displaying a 'Home' tab
        print("...MainPage.validatePage()")
        logo_element = self.driver.find_element_by_id(self._logo_locator)

    def load_file(self, fname):        
        ## THIS WORKS when run 2nd time
        #WebDriverWait(self.driver, 180).until(EC.element_to_be_clickable((By.XPATH, self._file_load_error_ok_locator))).click()

        n_tries = 0
        while n_tries < 3:
            try:
                print("...n_tries: {n}".format(n=n_tries))
                # find file folder icon on left panel, and click
                print("...click on file folder icon on the left panel")
                folder_element = self.driver.find_element_by_xpath(self._file_folder_locator)
                folder_element.click()
                time.sleep(self._delay)

                print("... double clicking on file name")
                #file_locator = "//li[@class='jp-DirListing-item'][@title='{f}']".format(f=fname)

                #locator1 = "//li[@class='jp-DirListing-item'][@title='{f}']".format(f=fname)
                #locator2 = "//span[@class='jp-DirListing-itemText']"
                #file_locator = "{l1}{l2}".format(l1=locator1, l2=locator2)
                #file_element = self.driver.find_element_by_xpath(file_locator)
                locator1 = "//li[@class='jp-DirListing-item'][@title='{f}']//span".format(f=fname)
                file_element = self.driver.find_elements_by_xpath(locator1)[1]

                print("...found the element...")
                actionChains = ActionChains(self.driver)
                actionChains.move_to_element(file_element)
                print("...going to double click on the file name")
                actionChains.double_click(file_element)
                print("...going to perform...")
                actionChains.perform()
 
                print("...after double clicking on file name xxx")
                # this may be TEMPORARY -- check if 'File Load Error for clt.nc' pop up is temporary
                print("...click on the File Load Error for clt.nc OK button -- is this TEMPORARY?")
                print("...doing WebDriverWait...till the element is clickable")
                load_el = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, self._file_load_error_ok_locator)))
                print("FOUND file_load_error_ok element, n_tries: {n}".format(n=n_tries))
                load_el.click()
                break
            except TimeoutException:
                n_tries = n_tries + 1
                if n_tries == 3:
                    raise TimeoutException
                else:
                    print("going to retry...n_tries:{n}".format(n=n_tries))


        # validate that we have 'Select Kernel' pop up
        print("...looking for the 'Select Kernel' pop up")
        self.driver.find_element_by_xpath(self._select_kernel_popup_locator)
        print("...FOUND 'Select Kernel' pop up")
        time.sleep(self._delay)

        # click on the drop down arrow
        self.driver.find_element_by_xpath(self._select_kernel_drop_down_locator).click()
        time.sleep(self._delay)

        print("xxx _kernel_locator: {l}".format(l=self._kernel_locator))
        self.driver.find_element_by_xpath(self._kernel_locator).click()
        time.sleep(self._delay)

        # click on the 'SELECT' button
        print("xxx click on SELECT button")
        self.driver.find_element_by_xpath(self._kernel_select_button_locator).click()
        time.sleep(self._delay)

        # this may be TEMPORARY -- check if 'File Load Error for clt.nc' pop up is temporary
        #print("...click on the File Load Error for clt.nc OK button -- is this TEMPORARY?")
        #self.driver.find_element_by_xpath(self._file_load_error_ok_locator).click()
        #time.sleep(self._delay)
