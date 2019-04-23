import time

from BasePage import BasePage
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


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

    def find_tab_and_click(self, tab_name):
        '''
        find the tab element ('File', 'Edit', 'View', 'Run'...) and
        return the element
        '''
        print("...finding tab for '{t}'".format(t=tab_name))
        tab_locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), '{n}')]".format(n=tab_name)
        try:
            tab_label_element = self.driver.find_element_by_xpath(tab_locator)
            tab_label_element.click()
        except NoSuchElementException as e:
            print("...did not find tab for '{t}'".format(t=tab_name))
            raise e

    def find_menu_item_from_tab_drop_down_and_click(self, menu_item_name):
        '''
        find the specified menu item from the tab drop down, and
        click on it.
        '''
        print("xxx...look for '{m}' from drop down menu".format(m=menu_item_name))
        menu_item_locator = "//div[@class='p-Menu-itemLabel' and contains(text(), '{n}')]".format(n=menu_item_name)
        try:
            wait = WebDriverWait(self.driver, 10)
            m = wait.until(EC.element_to_be_clickable((By.XPATH,
                                                       menu_item_locator)))
            print("...clicking on {i}".format(i=menu_item_name))
            m.click()
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("Did not find '{m}' from the drop down menu".format(m=menu_item_name))
            raise e

    def find_menu_item_from_tab_drop_down_find_submenu_by_constraint(self, menu_item_name, constraint):
        '''
        find the specified menu item from the tab drop down, and
        click on it.
        '''
        print("XXX xxx...look for '{m}' from drop down menu".format(m=menu_item_name))
        menu_with_submenu_loc = "//li[@class='p-Menu-item' and @data-type='submenu']"
        item_label_locator = ".//div[@class='p-Menu-itemLabel']"
        submenu_item_locator = "//ul[@class='p-Menu-content']//li[@class='p-Menu-item' and {c}]".format(c=constraint)
        items_with_submenu = self.driver.find_elements_by_xpath(menu_with_submenu_loc)
        n = 0
        print("DEBUG...# of submenus: {num}".format(num=len(items_with_submenu)))
        for i in items_with_submenu:
            item_label = i.find_element_by_xpath(item_label_locator).text
            if item_label == menu_item_name:
                print("FOUND FOUND...{m}, n = {n}".format(m=menu_item_name, n=n))
                submenu_divs = i.find_elements_by_xpath("./div")
                print("DEBUG DEBUG...# of submenu_divs: {n}".format(n=len(submenu_divs)))
                for d in submenu_divs:
                    print("DEBUG DEBUG...div class: {dc}".format(dc=d.get_attribute('class')))
                ActionChains(self.driver).move_to_element(submenu_divs[0]).perform()
                print("DEBUG...moved to submenu element...")
                time.sleep(self._delay * 2)
                try:
                    submenu_element = self.driver.find_element_by_xpath(submenu_item_locator)
                    ActionChains(self.driver).move_to_element(submenu_element).click().perform()
                    print("going...to sleep...")
                    time.sleep(self._delay * 4)
                except NoSuchElementException as e:
                    print("Cannot find element...")
                    raise e
                break
            else:
                n += 1
        print("XXX xxx leaving find_menu_item_from_tab_drop_down_find_submenu_by_constraint()")

    def find_menu_item_with_command_from_tab_drop_down_and_click(self, data_command):
        '''
        find the specified menu item from the tab drop down, and
        click on it.
        '''
        loc = "//li[@class='p-Menu-item' and @data-command='{dc}']".format(dc=data_command)
        print("...locating {loc}".format(loc=loc))

        try:
            menu_item = self.driver.find_element_by_xpath(loc)
            ActionChains(self.driver).move_to_element(menu_item).click().perform()
        except NoSuchElementException as e:
            print("Cannot find element with : {loc}".format(loc=loc))
            raise e

    def find_menu_item_by_constraint_and_click(self, constraint):
        '''
        find the menu item with the specified constraint from the tab
        drop down, and click on it.
        '''
        # THIS WORKS FOR CHROME
        # menu_item_locator = "//li[@class='p-Menu-item' and {c}]".format(c=constraint)
        menu_item_locator = "//ul[@class='p-Menu-content']//li[@class='p-Menu-item' and {c}]".format(c=constraint)
        try:
            print("...wait till item is clickable...{m}".format(m=menu_item_locator))
            wait = WebDriverWait(self.driver, 10)
            m = wait.until(EC.element_to_be_clickable((By.XPATH,
                                                       menu_item_locator)))
            print("...going to click on the menu item...")
            ac = ActionChains(self.driver)
            ac.move_to_element(m).click().perform()
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("Did not find menu item with '{c}' constraint".format(c=constraint))
            raise e

    def click_on_tab(self, tab):
        print("...going to click on '{t}' tab...".format(t=tab))
        self.find_tab_and_click(tab)
        time.sleep(self._delay)

    def hover_over_tab(self, tab):
        print("...click on '{t}' tab...".format(t=tab))
        tab_element = self.find_tab(tab)
        actionChains = ActionChains(self.driver)
        actionChains.move_to_element(tab_element).perform()
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
        self.find_tab_and_click('Kernel')
        try:
            shutdown_kernel_locator_contraint = "@data-command='kernelmenu:shutdown'"
            self.find_menu_item_by_constraint_and_click(shutdown_kernel_locator_contraint)
        except NoSuchElementException:
            print("No need to shutdown kernel")
