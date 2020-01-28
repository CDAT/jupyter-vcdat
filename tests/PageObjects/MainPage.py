from ActionsPage import ActionsPage
from ActionsPage import InvalidPageException
from VcdatPanel import VcdatPanel
from selenium.common.exceptions import NoSuchElementException
from Locator import Locator
# from selenium.webdriver.common.by import By

VCDAT_LEFT_SIDEBAR_ID = "left-side-bar-vcdat"
VCDAT_ICON_CLASS = "jp-icon-vcdat"


class MainPage(ActionsPage):

    def __init__(self, driver, server):
        super(MainPage, self).__init__(driver, server)

    def _validate_page(self):
        # validate Main page is displaying a 'Home' tab
        logo_locator = 'jp-MainLogo'
        self.driver.find_element_by_id(logo_locator)

    # ------------NEW FUNCTIONS BELOW------------

    # TOP LEVEL LOCATORS (Always accessible on page)

    # Provides the locator for top menu items.
    # Items available: File, Edit, View, Run, Kernel, Tabs, Settings, Help
    def top_menu_item(self, name):
        loc = "//div[@class='p-MenuBar-itemLabel'][contains(text(),'{n}')]".format(
            n=name)
        return Locator(self, None, loc, "xpath", "{} Menu".format(name))

    # Provides locator for tabs on the left of main page.
    # Valid tabs: FileBrowser, Running, Commands, VCDAT, OpenTabs, ExtManager
    def left_tab(self, tab):
        Tabs = {
            "FileBrowser": ["filebrowser", "File Browser Icon"],
            "Running": ["jp-running-sessions", "Running Session Icon"],
            "Commands": ["command-palette", "Command Palette Icon"],
            "VCDAT": [VCDAT_LEFT_SIDEBAR_ID, "VCDAT Icon"],
            "OpenTabs": ["tab-manager", "Open Tabs Icon"],
            "ExtManager": ["extensionmanager.main-view", "Extension Manager Icon"]
        }
        tab_id = Tabs[tab][0]
        tab_descr = Tabs[tab][1]
        loc = "//div[@id='jp-main-content-panel']//li[@data-id='{f}']".format(
            f=tab_id)
        return Locator(self, None, loc, "xpath", tab_descr)

    # Will make sure the selected tab panel is open
    # Valid tabs: FileBrowser, Running, Commands, VCDAT, OpenTabs, ExtManager
    def open_left_tab(self, tab):
        tab_locator = self.left_tab(tab)
        if tab == "VCDAT":
            other_locator = self.left_tab("FileBrowser")
        else:
            other_locator = self.left_tab("VCDAT")
        other_locator.click()
        tab_locator.click()

    # SUB LEVEL LOCATORS

    # Provides locator for the 'folder' icon in the file browser
    def home_icon(self):
        loc = ("// *[@id='filebrowser']/div[contains(@class, 'jp-FileBrowser-crumbs')]"
               "/ span[contains(@class, 'jp-BreadCrumbs-home')]")
        self.open_left_tab("FileBrowser")
        return Locator(self, None, loc, "xpath")

    # Provides the locator for an item within a top menu. top_menu_item -> sub_menu_item
    # Example: sub_menu_item("File","Export As") returns locator for 'Export As' submenu located in 'File' top menu.
    def sub_menu_item(self, parent, name, descr=""):
        parent_locator = self.top_menu_item(parent)
        loc = "//ul[@class='p-Menu-content']/li[contains(@class,'p-Menu-item')]"
        loc += "/div[@class='p-Menu-itemLabel'][contains(text(),'{n}')]".format(n=name)
        return Locator(self, parent_locator, loc, "xpath", descr)

    # Example below starts the vcdat tutorial intro found in the 'Help' menu,
    # function below should work whether the help menu is currently open or not.
    def tutorial_start(self):
        # Make sure VCDAT panel is open
        self.open_left_tab("VCDAT")

        # Method 1, use generalized submenu function in MainPage to do the same as above
        return self.sub_menu_item("Help", "VCDAT Tutorial: Introduction", "VCDAT Intro Tutorial Button")

        # Method 2, get parent locator, get selector, create locator object
        """
        parent_loc = self.top_menu_item("Help")
        loc = "//div[@class='p-Menu-itemLabel'][contains(text(),'VCDAT Tutorial: Introduction')]"
        return Locator(self,parent_loc,loc,"xpath","VCDAT Intro Tutorial Button")
        """

    def tutorial_next(self):
        parent_loc = self.tutorial_start()
        loc = "//*[contains(@id,'react-joyride-step')]//button[contains(@aria-label,'Next')]"
        return Locator(self, parent_loc, loc, "xpath", "Tutorial 'Next' Button")

    def tutorial_skip(self):
        parent_loc = self.tutorial_start()
        loc = "//*[contains(@id,'react-joyride-step')]//button[contains(@aria-label,'Skip')]"
        return Locator(self, parent_loc, loc, "xpath", "Tutorial 'Skip' Button")

    # --------------END OF NEW FUNCTIONS-----------------

    # Locators for the main dock panel (where notebooks and launcher are displayed)
    def locate_launcher_tab(self):
        return "//div[@id='jp-main-dock-panel']//li[contains(@data-id,'launcher')]"

    def locate_notebook_launcher_cards(self):
        try:
            launchers = self.find_elements("jp-LauncherCard", "class")
            if launchers is None:
                self.locate_new_launcher_icon().click()  # Open launcher if none was found
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
            print(
                "Did not find launcher with specified title {t}".format(t=title))
            return None
        except NoSuchElementException as e:
            print(
                "NoSuchElementException...did not find specified launcher {}".format(title))
            raise e

    def click_on_notebook_launcher(self, title):
        element = self.locate_notebook_launcher(title)
        self.move_to_click(element)

    def click_on_folder_tab(self):
        self.open_left_tab("FileBrowser")
        # check that there is a 'New Launcher' icon
        launcher_icon = self.new_launcher_icon()
        if launcher_icon.element is None:
            print(launcher_icon)
            return
        else:
            element = launcher_icon.element
        if not element.is_displayed() or not element.is_enabled():
            print("New Launcher element is not displayed nor enabled")
            if element.is_displayed() and element.is_enabled():
                print("New Launcher element is displayed and enabled")

    def click_on_vcdat_icon(self):
        self.open_left_tab("VCDAT")
        try:
            vcdat_panel = VcdatPanel(self.driver, None)
            return vcdat_panel
        except InvalidPageException:
            "Error occured when opening VCDAT panel"

    #
    # select jp tool bar icon
    #
    def file_browser_button(self, icon_title):
        loc = "//*[@id='filebrowser']//button[@title='{}']".format(icon_title)
        self.open_left_tab("FileBrowser")
        return Locator(self, None, loc, "xpath", icon_title)

    def new_launcher_icon(self):
        return self.file_browser_button("New Launcher")

    def new_folder_icon(self):
        return self.file_browser_button("New Folder")

    def upload_files_icon(self):
        return self.file_browser_button("Upload Files")

    def refresh_file_list_icon(self):
        return self.file_browser_button("Refresh File List")

    def click_on_select_kernel(self):
        '''
        click on the 'SELECT' button in the 'Select Kernel' pop up.
        '''
        select_kernel_popup_locator = "//span[contains(text(), 'Select Kernel')]"
        kernel_select_button_locator = "//button//div[contains(text(), 'Select')]"

        print("...click on 'SELECT' in the 'Select Kernel' pop up")
        try:
            self.find_element(select_kernel_popup_locator, "xpath")
            el = self.find_element(kernel_select_button_locator, "xpath")
            # time.sleep(self._a_bit_delay)
            self.move_to_click(el)
            # time.sleep(self._delay)
        except NoSuchElementException as e:
            print("did not find 'Select Kernel' pop up")
            raise e

    def shutdown_kernel(self):
        print("...shutdown kernel if need to...")
        self.sub_menu_item("Kernel", "Shutdown Kernel").click()

    def shutdown_all_kernels(self):
        print("...shutdown all kernels...")
        self.sub_menu_item("Kernel", "Shut Down All Kernels").click()


"""
class TopMenuBar:

    def __init__(self, main_page):
        self.main_page = main_page
        self.locator = ""
        self.loc_type = ""
        self.description = ""

    def file_menu(self):
        self.locator = self.main_page.locate_top_menu_item("File")
        self.loc_type = "xpath"
        self.description = "File menu"
        return self

    def edit_menu(self):
        self.locator = self.main_page.top_menu_item("Edit")
        self.loc_type = "xpath"
        self.description = "Edit menu"
        return self

    def kernel_menu(self):
        self.locator = self.main_page.top_menu_item("Kernel")
        self.loc_type = "xpath"
        self.description = "Kernel menu"
        return self

    def kernel_menu_shutdown(self):
        self.locator = "//ul[@class='p-Menu-content']/li[@data-command='kernelmenu:shutdown']"
        self.loc_type = "xpath"
        self.description = "Kernel Shutdown"
        return self

    def export_notebook_as(self):
        self.locator = "//ul[@class='p-Menu-content']/li[@data-type='submenu']"
        self.locator += "/div[contains(text(),'Export Notebook As')]"
        self.description = "Export file as"
        self.click()
        self.locator = "//ul[@class='p-Menu-content']/li[@data-type='command']"
        self.locator += "/div[contains(text(),'Export Notebook to HTML')]"
        return self

    def click(self):
        self.main_page.move_to_click(self.element())

    def element(self):
        return self.main_page.find_element(self.locator,self.description,self.loc_type) """
