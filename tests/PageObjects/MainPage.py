from ActionsPage import ActionsPage
from ActionsPage import InvalidPageException
from VcdatPanel import VcdatPanel
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
# from selenium.webdriver.common.by import By

import time

VCDAT_LEFT_SIDEBAR_ID = "left-side-bar-vcdat"
VCDAT_ICON_CLASS = "jp-icon-vcdat"


class MainPage(ActionsPage):

    def __init__(self, driver, server):
        super(MainPage, self).__init__(driver, server)

    def _validate_page(self):
        # validate Main page is displaying a 'Home' tab
        logo_locator = 'jp-MainLogo'
        self.driver.find_element_by_id(logo_locator)

    def locate_top_menu_item(self, name):
        '''
        find the tab element ('File', 'Edit', 'View', 'Run'...) and
        return the element
        '''
        item_locator = "//div[@class='p-MenuBar-itemLabel'][contains(text(), '{n}')]".format(
            n=name)
        try:
            item_element = self.find_element_by_xpath(item_locator,
                                                      "top menu item {n}".format(n=name))
            return item_element
        except NoSuchElementException as e:
            print("NoSuchElementException...not finding '{n}'".format(n=name))
            raise e

    def click_on_top_menu_item(self, name):
        '''
        click the tab element ('File', 'Edit', 'View', 'Run'...)
        '''
        try:
            element = self.locate_top_menu_item(name)
            time.sleep(self._a_bit_delay)
            ActionChains(self.driver).move_to_element(
                element).click().perform()
            # self.move_to_click(element)
        except NoSuchElementException as e:
            print("...did not find tab for '{}'".format(name))
            raise e

    def click_on_submenu(self, submenu_name):
        '''
        click on submenu that shows up as a result of click_top_menu_item()
        '''
        try:
            submenu_locator = "//div[@class='p-Menu-itemLabel'][contains(text(), '{}')]".format(
                submenu_name)
            # submenu = self.wait_till_element_is_visible(By.XPATH, submenu_locator,
            #                                             "submenu '{}'".format(submenu_name))
            submenu = self.find_element_by_xpath(submenu_locator,
                                                 "submenu '{}'".format(submenu_name))
            time.sleep(self._delay * 2)
            ActionChains(self.driver).move_to_element(
                submenu).click().perform()
            time.sleep(self._delay)
        except NoSuchElementException as e:
            raise e

    def click_on_submenu_with_data_commandORIG(self, submenu_data_command, submenu_name):
        '''
        click on submenu item that has 'data-command' attribute
        '''
        try:
            # data_command = "//li[@data-command='{dc}']".format(dc=submenu_data_command)
            data_command = "//li[contains(@data-command, '{dc}')]".format(
                dc=submenu_data_command)
            text_label = "//div[@class='p-Menu-itemLabel']"
            submenu_locator = "{dc}{text}".format(
                dc=data_command, text=text_label)
            submenu = self.find_element_by_xpath(submenu_locator,
                                                 "sub menu item name: {}".format(submenu_name))
            time.sleep(self._a_bit_delay * 2)
            ActionChains(self.driver).move_to_element(
                submenu).click().perform()
            time.sleep(self._delay)

        except NoSuchElementException as e:
            raise e

    def click_on_submenu_with_data_command(self, submenu_data_command, submenu_name):
        '''
        click on submenu item that has 'data-command' attribute
        '''
        print("DEBUG DEBUG DEBUG...click_on_submenu_with_data_command()...{m}".format(m=submenu_name)))
        try:
            menu_items_locator = "//li[@class='p-Menu-item' and @data-type='command']"
            menu_items = self.find_elements_by_xpath(menu_items_locator, 'menu items')
            the_menu_item = None
            print("DEBUG DEBUG DEBUG...# of menu items: {i}".format(i=len(menu_items)))
            for m in menu_items:
                data_command = m.get_attribute("data-command")
                print("DEBUG DEBUG...data_command: {dc}".format(dc=data_command))
                if data_command == submenu_data_command:
                    the_menu_item = m
                    break
            if the_menu_item:
                print("FOUND...{m}".format(m=submenu_name))
                time.sleep(self._a_bit_delay * 2)
                ActionChains(self.driver).move_to_element(the_menu_item).click().perform()
                time.sleep(self._delay)

        except NoSuchElementException as e:
            raise e

    def locate_folder_tab(self):
        return self.find_element_by_xpath("//*[@data-id='filebrowser']", "Jupyter lab file tab")

    def locate_running_tab(self):
        return self.find_element_by_xpath("//*[@data-id='jp-running-sessions']", "Running terminals and kernels tab")

    def locate_command_palette_tab(self):
        return self.find_element_by_xpath("//*[@data-id='command-palette']", "Jupyter lab command palette tab")

    def locate_vcdat_icon(self):
        return self.find_element_by_xpath("//*[@data-id='{}']".format(VCDAT_LEFT_SIDEBAR_ID), "VCDAT icon")

    def locate_open_tabs_tab(self):
        return self.find_element_by_xpath("//*[@data-id='tab-manager']", "Jupyter lab open tabs sidebar tab")

    def locate_notebook_launcher_cards(self):
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

    def locate_notebook_launcher(self, title):
        try:
            launchers = self.locate_notebook_launcher_cards()
            for launcher in launchers:
                if launcher.get_attribute("title") == title:
                    print("FOUND launcher titled {}".format(title))
                    return launcher
            return "Did not find launcher with specified title {t}".format(t=title)
        except NoSuchElementException as e:
            print(
                "NoSuchElementException...did not find specified launcher {}".format(title))
            raise e

    def click_on_notebook_launcher(self, title):
        element = self.locate_notebook_launcher(title)
        self.move_to_click(element)

    #
    # click on icons on left side bar
    #
    def click_on_folder_tab(self):
        element = self.locate_folder_tab()
        self.move_to_click(element)
        # check that there is a 'New Launcher' icon
        new_launcher_element = self.locate_new_launcher_icon()
        if not new_launcher_element.is_displayed() or not new_launcher_element.is_enabled():
            print("New Launcher element is not displayed nor enabled")
            time.sleep(5)
            print("clicking on the folder tab again")
            self.move_to_click(element)
            if new_launcher_element.is_displayed() and new_launcher_element.is_enabled():
                print("New Launcher element is displayed and enabled")
        time.sleep(self._delay)

    def click_on_running_tab(self):
        element = self.locate_running_tab()
        self.move_to_click(element)

    def click_on_command_palette_tab(self):
        element = self.locate_command_palette_tab()
        self.move_to_click(element)

    def click_on_vcdat_icon(self):
        element = self.locate_vcdat_icon()
        self.move_to_click(element)
        try:
            vcdat_panel = VcdatPanel(self.driver, None)
            return vcdat_panel
        except InvalidPageException:
            element = self.locate_vcdat_icon()
            self.move_to_click(element)

    def click_on_open_tabs_tab(self):
        element = self.locate_open_tabs_tab()
        time.sleep(self._delay)
        self.move_to_click(element)

    def locate_home_icon(self):
        loc = ("// *[@id='filebrowser']/div[contains(@class, 'jp-FileBrowser-crumbs')]"
               "/ span[contains(@class, 'jp-BreadCrumbs-home')]")
        return self.find_element_by_xpath(loc, "Folder Icon")

    def click_on_home_icon(self):
        element = self.locate_home_icon()
        self.move_to_click(element)

    #
    # select jp tool bar icon
    #
    def locate_jp_tool_bar_icon(self, icon_title):
        loc = "//*[@id='filebrowser']//button[@title='{}']".format(icon_title)
        try:
            element = self.find_element_by_xpath(loc, icon_title)
        except NoSuchElementException as e:
            print("Did not find jp tool bar '{}' icon".format(icon_title))
            raise e
        return element

    def locate_new_launcher_icon(self):
        return self.locate_jp_tool_bar_icon("New Launcher")

    def locate_new_folder_icon(self):
        return self.locate_jp_tool_bar_icon("New Folder")

    def locate_upload_files_icon(self):
        return self.locate_jp_tool_bar_icon("Upload Files")

    def locate_refresh_file_list_icon(self):
        return self.locate_jp_tool_bar_icon("Refresh File List")

    def click_on_jp_tool_bar_icon(self, icon_title):
        element = self.locate_jp_tool_bar_icon(icon_title)
        self.move_to_click(element)

    def click_on_new_launcher_icon(self):
        element = self.locate_new_launcher_icon()
        self.move_to_click(element)

    def click_on_new_folder_icon(self):
        element = self.locate_new_folder_icon()
        self.move_to_click(element)

    def click_on_upload_files_icon(self):
        element = self.locate_upload_files_icon()
        self.move_to_click(element)

    def click_on_refresh_file_list_icon(self):
        element = self.locate_refresh_file_list_icon()
        self.move_to_click(element)

    #
    #
    #

    def click_on_select_kernel(self):
        '''
        click on the 'SELECT' button in the 'Select Kernel' pop up.
        '''
        select_kernel_popup_locator = "//span[contains(text(), 'Select Kernel')]"
        kernel_select_button_locator = "//button//div[contains(text(), 'Select')]"

        print("...click on 'SELECT' in the 'Select Kernel' pop up")
        try:
            self.find_element_by_xpath(
                select_kernel_popup_locator, "Select Kernel popup")
            el = self.find_element_by_xpath(
                kernel_select_button_locator, "Kernel Select button")
            # time.sleep(self._a_bit_delay)
            self.move_to_click(el)
            # time.sleep(self._delay)
        except NoSuchElementException as e:
            print("did not find 'Select Kernel' pop up")
            raise e

    def shutdown_kernel(self):
        print("...shutdown kernel if need to...")

        self.click_on_top_menu_item('Kernel')
        data_command = "kernelmenu:shutdown"
        try:
            self.click_on_submenu_with_data_command(
                data_command, 'Shut Down Kernel')
        except NoSuchElementException:
            pass

    def shutdown_all_kernels(self):
        print("...shutdown all kernels...")
        self.click_on_top_menu_item('Kernel')
        data_command = "kernelmenu:shutdownAll"
        self.click_on_submenu_with_data_command(data_command,
                                                'Shut Down All Kernels')
        shutdown_locator = "//div[contains(@class,'jp-Dialog-buttonLabel')][contains(text(),'Shut Down All')]"
        try:
            shutdown = self.find_element_by_xpath(shutdown_locator,
                                                  "'Shut Down All' button")
            self.move_to_click(shutdown)
        except NoSuchElementException as e:
            print("Did not find 'Shut Down All' button in the 'Shut Down All?' popup")
            raise e
