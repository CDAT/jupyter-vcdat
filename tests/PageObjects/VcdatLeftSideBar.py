import time

from BasePage import BasePage
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class VcdatLeftSideBar(BasePage):

    def __init__(self, driver, server=None):
        super(VcdatLeftSideBar, self).__init__(driver, server)

    def _validate_page(self):
        print("...VcdatLeftSideBar.validate_page()...NO OP NOW")

    def click_on_icon(self, icon_data_id):
        '''
        click on an icon  on the left side bar if it is not an active tab yet.
        icon_data_id: data-id locator for the icon
        '''
        print("...click_on_icon...icon_data_id: {id}".format(id=icon_data_id))
        icon_locator = "//li[@data-id='{i}']".format(i=icon_data_id)
        try:
            icon_element = self.driver.find_element_by_xpath(icon_locator)
            class_attr = icon_element.get_attribute('class')
            print("DEBUG DEBUG...class_attr: {ca}".format(ca=class_attr))
            if "p-mod-current" in class_attr:
                print("No need to click on '{i}' icon...it is active".format(i=icon_data_id))
                return
        except NoSuchElementException as e:
            print("...did not find '{i}' icon on left side...".format(i=icon_data_id))
            raise e
        try:
            wait = WebDriverWait(self.driver, 10)
            m = wait.until(EC.element_to_be_clickable((By.XPATH, icon_locator)))
            time.sleep(self._delay)
            ActionChains(self.driver).move_to_element(m).click().perform()
            time.sleep(self._delay)
            print("...AFTER click_on_icon...icon_data_id: {id}".format(id=icon_data_id))
        except TimeoutException as e:
            print("...did not find '{i}' icon on left side...".format(i=icon_data_id))
            raise e

    def click_on_jp_vcdat_icon(self):
        '''
        click on the jupyter vcdat icon on the left side bar if it is
        not an active tab yet.
        '''
        print("...click_on_jp_vcdat_icon...")
        self.click_on_icon('vcdat-left-side-bar')

    def click_on_file_folder(self):
        '''
        click on the file folder icon on the left side bar if it is
        not an active tab yet.
        '''
        print("...click_on_file_folder...")
        self.click_on_icon('filebrowser')

    def click_on_load_variables(self):
        print("...click_on_load_variables...")
        load_variables_locator = "//button[contains(text(), 'Load Variable(s)')]"
        self.find_element_and_click(load_variables_locator, "'Load Variable(s)' button")

    def click_on_plot(self):
        print("...click on 'Plot' button...")
        plot_button_locator = "//button[contains(text(), 'Plot')]"
        self.find_element_and_click(plot_button_locator, "'Plot' button")

    def click_on_clear(self):
        print("...click on 'Clear' button...")
        plot_button_locator = "//button[contains(text(), 'Clear')]"
        self.find_element_and_click(plot_button_locator, "'Clear' button")

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
