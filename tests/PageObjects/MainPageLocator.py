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
            return item_element
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding '{n}'".format(n=name))
            raise e

    def click_top_menu_item(self, name):
        '''
        click the tab element ('File', 'Edit', 'View', 'Run'...)
        '''
        try:
            element = self.select_top_menu_item(name)
            time.sleep(self._a_bit_delay)
            ActionChains(self.driver).move_to_element(element).click().perform()
        except NoSuchElementException as e:
            print("...did not find tab for '{}'".format(name))
            raise e

    def click_on_submenu(self, submenu_name):
        '''
        click on submenu that shows up as a result of click_top_menu_item()
        '''
        try:
            submenu_locator = "//div[@class='p-Menu-itemLabel'][contains(text(), '{}')]".format(submenu_name)
            print("DEBUG....submenu_locator: {}".format(submenu_locator))
            submenu = self.find_element_by_xpath(submenu_locator,
                                                 "sub menu item name: {}".format(submenu_name))
            time.sleep(self._a_bit_delay * 2)
            ActionChains(self.driver).move_to_element(submenu).click().perform()
            time.sleep(5)
        except NoSuchElementException as e:
            raise e

    def click_on_submenu_with_data_command(self, submenu_data_command, submenu_name):
        '''
        click on submenu item that has 'data-command' attribute
        '''
        try:
            data_command = "//li[@data-command='{dc}']".format(dc=submenu_data_command)
            text_label = "//div[@class='p-Menu-itemLabel'][contains(text(), '{name}')]".format(name=submenu_name)
            submenu_locator = "{dc}{text}".format(dc=data_command, text=text_label)
            print("DEBUG....submenu_locator: {}".format(submenu_locator))
            submenu = self.find_element_by_xpath(submenu_locator,
                                                 "sub menu item name: {}".format(submenu_locator))
            time.sleep(self._a_bit_delay * 2)
            ActionChains(self.driver).move_to_element(submenu).click().perform()
            print("DEBUG...after clicking")
            time.sleep(10)

        except NoSuchElementException as e:
            raise e

    def select_file_tab(self):
        return self.find_element_by_class("jp-FolderIcon", "Jupyter lab file tab")

    def select_running_tab(self):
        return self.find_element_by_class("jp-DirectionsRunIcon", "Running terminals and kernels tab")

    def select_command_palette_tab(self):
        return self.find_element_by_class("jp-PaletteIcon", "Jupyter lab command palette tab")

    def select_vcdat_icon(self):
        # return self.find_element_by_class(VCDAT_ICON_CLASS, "VCDAT icon")
        # cl = "p-TabBar-tabIcon jp-SideBar-tabIcon jp-icon-vcdat"
        # loc = "//div[@class='p-TabBar-tabIcon jp-SideBar-tabIcon jp-icon-vcdat']"
        loc = "//li[@data-id='left-side-bar-vcdat']"
        return self.find_element_by_xpath(loc, "VCDAT icon")

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

    #
    # click on icons on left side bar
    #
    def click_on_left_side_tab(self, tab_name):
        tab_mapping = {
            "jp-folder": {'class': "jp-FolderIcon", 'descr': "Jupyter lab file tab"},
            "jp-direction-run": {'class': "jp-DirectionsRunIcon", 'descr': "Running terminals and kernels tab"},
            "jp-pallette": {'class': "jp-PaletteIcon", 'descr': "Jupyter lab command palette tab"},
            "vcdat-icon": {'class': VCDAT_ICON_CLASS, 'descr': "VCDAT icon"},
            "jp-tab-icon": {'class': "jp-SideBar-tabIcon", 'descr': "Jupyter lab open tabs sidebar tab"}
            }
        tab_class = tab_mapping[tab_name]["class"]
        tab_descr = tab_mapping[tab_name]["descr"]
        element = self.find_element_by_class(tab_class, tab_descr)
        # time.sleep(self._a_bit_delay)
        ActionChains(self.driver).move_to_element(element).click().perform()
        time.sleep(self._delay)

    def click_on_jp_folder_icon(self):
        '''
        click on jp folder icon on left side
        '''
        self.click_on_left_side_tab('jp-folder')
        # validate that there is a 'New Launcher' icon (+)

    def click_on_jp_direction_run_icon(self):
        self.click_on_left_side_tab('jp-direction-run')

    def click_on_jp_pallette_icon(self):
        self.click_on_left_side_tab('jp-pallette')

    def click_on_vcdat_icon(self):
        self.click_on_left_side_tab('vcdat-icon')

    def click_on_jp_tab_icon(self):
        self.click_on_left_side_tab('jp-tab-icon')

    #
    # select jp tool bar icon
    #
    def select_jp_tool_bar_icon(self, icon_title):
        '''
        clicks on the specified icon on the jp tool bar.
        icon_title: title/name of icon, can be one of these:
            "New Launcher"
            "New Folder"
            "Upload Files"
            "Refresh File List"
        '''
        # all jp tool bar buttons are of class 'jp-ToolbarButtonComponent'
        loc = "//button[@class='jp-ToolbarButtonComponent' and @title='{}']".format(icon_title)
        try:
            element = self.find_element_by_xpath(loc, icon_title)
        except NoSuchElementException as e:
            print("Did not find jp tool bar '{}' icon".format(icon_title))
            raise e
        return element

    def click_on_jp_tool_bar_icon(self, icon_title):
        element = self.select_jp_tool_bar_icon(icon_title)
        self.move_to_click(element)

    def click_on_new_launcher_icon(self):
        self.click_on_jp_tool_bar_icon("New Launcher")

    def click_on_new_folder_icon(self):
        self.click_on_jp_tool_bar_icon("New Folder")

    def click_on_upload_files_icon(self):
        self.click_on_jp_tool_bar_icon("Upload Files")

    def click_on_refresh_file_list_icon(self):
        self.click_on_jp_tool_bar_icon("Refresh File List")

    #
    #
    #

    def click_on_select_kernel(self):
        '''
        click on the 'SELECT' button in the 'Select Kernel' pop up.
        '''
        select_kernel_popup_locator = "//span[contains(text(), 'Select Kernel')]"
        kernel_select_button_locator = "//button//div[contains(text(), 'SELECT')]"

        print("...click on 'SELECT' in the 'Select Kernel' pop up")
        try:
            self.find_element_by_xpath(select_kernel_popup_locator, "Select Kernel popup")
            el = self.find_element_by_xpath(kernel_select_button_locator, "Kernel Select button")
            time.sleep(self._a_bit_delay)
            self.move_to_click(el)
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

    """
