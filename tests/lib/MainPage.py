import time

from BasePage import BasePage


class MainPage(BasePage):

    def __init__(self, driver, server):
        super(MainPage, self).__init__(driver, server)

    def _validate_page(self):
        # validate Main page is displaying a 'Home' tab
        print("...MainPage.validatePage()")
        logo_locator = 'jp-MainLogo'
        self.driver.find_element_by_id(logo_locator)

    def click_on_load_variables(self):
        load_variables_locator = "//button[@class='btn btn-info'][contains(text(), 'Load Variables')]"
        load_variables_element = self.driver.find_element_by_xpath(load_variables_locator)
        print("FOUND element")
        load_variables_element.click()
        time.sleep(self._delay)

    def shutdown_kernel(self):
        kernel_tab_locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), 'Kernel')]"
        kernel_tab_element = self.driver.find_element_by_xpath(kernel_tab_locator)
        shutdown_kernel_element = "//div[contains(text(), 'Shutdown Kernel')]"
        print("FOUND 'Kernel' tab")
        kernel_tab_element.click()
        print("...shut down kernel...")
        self.driver.find_element_by_xpath(shutdown_kernel_element).click()
        time.sleep(self._delay)
