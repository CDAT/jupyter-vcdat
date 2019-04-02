import time

from BasePage import BasePage
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains


class VcdatLeftSideBar(BasePage):

    _jp_vcdat_icon_locator = "//div[@class='p-TabBar-tabIcon jp-vcdat-icon jp-SideBar-tabIcon']"
    _variable_options_locator = "//div[@id='vcdat-left-side-bar']//h5[contains(text(), 'Variable Options')]"
    _load_variables_locator = "//button[@class='btn btn-info'][contains(text(), 'Load Variables')]"

    def __init__(self, driver, server=None):
        super(VcdatLeftSideBar, self).__init__(driver, server)

    def _validate_page(self):
        print("...VcdatLeftSideBar.validate_page()...NO OP NOW")

    def click_on_jp_vcdat_icon(self):
        found_load_variables_element = False
        while found_load_variables_element is False:
            print("...click_on_jp_vcdat_icon...")
            jp_vcdat_icon_element = self.driver.find_element_by_xpath(self._jp_vcdat_icon_locator)
            jp_vcdat_icon_element.click()
            time.sleep(self._delay)
            try:
                load_variables_element = self.driver.find_element_by_xpath(self._load_variables_locator)
                if load_variables_element.is_displayed():
                    print("...FOUND 'Load Variables' button XXX")
                    found_load_variables_element = True
                else:
                    print("...'Load Variables' button is not displayed")
            except NoSuchElementException:
                print("...not seeing Load Variables button..")

    def click_on_load_variables(self):
        print("...click_on_load_variables...")
        load_variables_element = self.driver.find_element_by_xpath(self._load_variables_locator)
        # load_variables_element.click()

        actionChains = ActionChains(self.driver)
        actionChains.move_to_element(load_variables_element)
        print("...going to click on the load variables element")
        actionChains.click(load_variables_element).perform()
        time.sleep(self._delay)

    def click_on_plot(self):
        print("...click on 'Plot' button...")
        plot_button_locator = "//button[contains(text(), 'Plot')]"
        self.find_element_and_click(plot_button_locator, "'Plot' button")
        time.sleep(self._delay)

    def click_on_clear(self):
        print("...click on 'Clear' button...")
        plot_button_locator = "//button[contains(text(), 'Clear')]"
        self.find_element_and_click(plot_button_locator, "'Clear' button")
        time.sleep(self._delay)

    def select_plot_type(self, plot_type):
        select_plot_button_locator = "//button[contains(text(), 'Select Plot Type')]"
        try:
            select_plot_button = self.driver.find_element_by_xpath(select_plot_button_locator)
            print("...clicking on 'Select Plot Type' button")
            select_plot_button.click()
            time.sleep(self._delay)
            print("...click on the '{p}' from the drop down menu".format(p=plot_type))
            button_elements_locator = "//div[@id='vcdat-left-side-bar']//button[@class='dropdown-item']"
            button_elements = self.driver.find_elements_by_xpath(button_elements_locator)
            saved_button = None
            for b in button_elements:
                # print("DEBUG...b.text: {button_text}".format(button_text=b.text))
                if b.text == plot_type:
                    print("FOUND the '{p}' from drop down menu".format(p=plot_type))
                    time.sleep(self._delay)
                    saved_button = b
                    break
            if saved_button:
                saved_button.click()

        except NoSuchElementException as e:
            print("Not finding 'Select Plot Type' button")
            raise e

        # REVISIT validate that the Graphics Options button now shows the selected plot_type
