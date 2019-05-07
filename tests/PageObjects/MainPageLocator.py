from Actions import Actions
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains

import time

VCDAT_LEFT_SIDEBAR_ID = "left-side-bar-vcdat"
VCDAT_ICON_CLASS = "jp-icon-vcdat"


class MainPageLocator(Actions):

    def __init__(self, driver, server):
        super(MainPageLocator, self).__init__(driver, server)

    def _validate_page(self):
        # validate Main page is displaying a 'Home' tab
        logo_locator = 'jp-MainLogo'
        self.driver.find_element_by_id(logo_locator)

    def select_top_menu_item(self, name):
        '''
        find the tab element ('File', 'Edit', 'View', 'Run'...) and
        return the element
        '''
        item_locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), '{n}')]".format(
            n=name)
        try:
            item_element = self.find_element_by_xpath(
                item_locator, " top menu item {n}".format(n=name))
            print("FOUND '{n}' top menu item.".format(n=name))
            return item_element
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding '{n}'".format(n=name))
            raise e

    def click_top_menu_item(self, name):
        '''
        click the tab element ('File', 'Edit', 'View', 'Run'...)
        '''
        locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), '{}')]".format(name)
        try:
            element = self.find_element_by_xpath(locator,
                                                 "top menu item name: {}".format(name))
            time.sleep(self._a_bit_delay)
            ActionChains(self.driver).move_to_element(element).click().perform()
        except NoSuchElementException as e:
            print("...did not find tab for '{}'".format(name))
            raise e

    def select_file_tab(self):
        return self.find_element_by_class("jp-FolderIcon", "Jupyter lab file tab")

    def select_running_tab(self):
        return self.find_element_by_class("jp-DirectionsRunIcon", "Running terminals and kernels tab")

    def select_command_palette_tab(self):
        return self.find_element_by_class("jp-PaletteIcon", "Jupyter lab command palette tab")

    def select_vcdat_icon(self):
        return self.find_element_by_class(VCDAT_ICON_CLASS, "VCDAT icon")

    def select_open_tabs_tab(self):
        return self.find_element_by_class("jp-SideBar-tabIcon", "Jupyter lab open tabs sidebar tab")

    def select_notebook_launcher_cards(self):
        try:
            launchers = self.find_elements_by_class(
                "jp-LauncherCard", "Jupyter lab launcher cards")
            nb_launchers = []
            for launcher in launchers:
                category = launcher.get_attribute("data-category")
                if category is not None and category == "Notebook":
                    nb_launchers.append(launcher)
            return nb_launchers
        except NoSuchElementException as e:
            print("NoSuchElementException... not notebook launchers found")
            raise e

    def select_notebook_launcher(self, title):
        try:
            launchers = self.select_notebook_launcher_cards()
            for launcher in launchers:
                if launcher.get_attribute("title") == title:
                    print("FOUND launcher titled {}".format(title))
                    return launcher
            return "Did not find launcher with specified title {t}".format(t=title)
        except NoSuchElementException as e:
            print(
                "NoSuchElementException...did not find specified launcher {}".format(title))
            raise e

    """
    def find_tab(self, tab_name):
        '''
        find the tab element ('File', 'Edit', 'View', 'Run'...) and
        return the element
        '''
        print("...find tab for '{t}'".format(t=tab_name))
        tab_locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), '{n}')]".format(
            n=tab_name)
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
        tab_locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), '{n}')]".format(
            n=tab_name)
        try:
            tab_label_element = self.driver.find_element_by_xpath(tab_locator)
            tab_label_element.click()
            wait = WebDriverWait(self.driver, 10)
            m = wait.until(EC.element_to_be_clickable((By.XPATH,
                                                       tab_locator)))
            m.click()
        except NoSuchElementException as e:
            print("...did not find tab for '{t}'".format(t=tab_name))
            raise e

    def find_menu_item_from_tab_drop_down_and_click(self, menu_item_name):
        '''
        find the specified menu item from the tab drop down, and
        click on it.
        '''
        print("...look for '{m}' from drop down menu".format(m=menu_item_name))
        locator = "//div[@class='p-Menu-itemLabel' and contains(text(), '{n}')]".format(
            n=menu_item_name)
        try:
            wait = WebDriverWait(self.driver, 10)
            m = wait.until(EC.element_to_be_clickable((By.XPATH,
                                                       locator)))
            print("...clicking on {i}".format(i=menu_item_name))
            m.click()
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("Did not find '{m}' from the drop down menu".format(
                m=menu_item_name))
            raise e

    def find_menu_item_from_tab_drop_down_find_submenu_with_command(self, menu_item_name,
                                                                    submenu_data_command):
        '''
        find the specified menu item from the tab drop down, and find the
        specified submenu item and click on the submenu item.

        '''
        print("...look for '{m}' from drop down menu".format(m=menu_item_name))
        menu_with_submenu_loc = "//li[@class='p-Menu-item' and @data-type='submenu']"
        item_label_locator = ".//div[@class='p-Menu-itemLabel']"
        submenu_item_locator = "//ul[@class='p-Menu-content']//li[@data-command='{c}']".format(
            c=submenu_data_command)
        items_with_submenu = self.driver.find_elements_by_xpath(
            menu_with_submenu_loc)
        n = 0
        for i in items_with_submenu:
            item_label = i.find_element_by_xpath(item_label_locator).text
            if item_label == menu_item_name:
                print("FOUND...{m}, n = {n}".format(m=menu_item_name, n=n))
                submenu_divs = i.find_elements_by_xpath("./div")
                # print("DEBUG DEBUG...# of submenu_divs: {n}".format(n=len(submenu_divs)))
                ActionChains(self.driver).move_to_element(
                    submenu_divs[0]).perform()
                time.sleep(self._delay)
                try:
                    submenu_element = self.driver.find_element_by_xpath(
                        submenu_item_locator)
                    ActionChains(self.driver).move_to_element(
                        submenu_element).click().perform()
                    time.sleep(self._delay)
                except NoSuchElementException as e:
                    print("Cannot find element...")
                    raise e
                break
            else:
                n += 1

    def find_menu_item_with_command_from_tab_drop_down_and_click(self, data_command):
        '''
        find the specified menu item from the tab drop down, and
        click on it.
        '''
        loc = "//li[@class='p-Menu-item' and @data-command='{dc}']".format(
            dc=data_command)
        print("...locating {loc}".format(loc=loc))

        try:
            menu_item = self.driver.find_element_by_xpath(loc)
            ActionChains(self.driver).move_to_element(
                menu_item).click().perform()
        except NoSuchElementException as e:
            print("Cannot find element with : {loc}".format(loc=loc))
            raise e

    def click_on_tab(self, tab):
        print("...going to click on '{t}' tab...".format(t=tab))
        self.find_tab_and_click(tab)
        time.sleep(self._delay)

    def select_kernel(self):
        '''
        click on the 'SELECT' button in the 'Select Kernel' pop up.
        '''
        select_kernel_popup_locator = "//span[contains(text(), 'Select Kernel')]"
        kernel_select_button_locator = "//button//div[contains(text(), 'SELECT')]"

        print("...click on 'SELECT' in the 'Select Kernel' pop up")
        try:
            self.driver.find_element_by_xpath(select_kernel_popup_locator)
            time.sleep(self._delay)
            self.find_element_by_xpath_and_click(
                kernel_select_button_locator, "Kernel Select button")
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("did not find 'Select Kernel' pop up")
            raise e

    def shutdown_kernel(self):
        print("...shutdown kernel if need to...")
        self.find_tab_and_click('Kernel')
        try:
            shutdown_kernel_locator = "kernelmenu:shutdown"
            self.find_menu_item_with_command_from_tab_drop_down_and_click(
                shutdown_kernel_locator)
        except NoSuchElementException:
            print("No need to shutdown kernel")
    """
