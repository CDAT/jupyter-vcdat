import os
import re
from ActionsPage import ActionsPage

"""
PageObject for the main page of JupyterLab application
Contains locator functions for all menu items and left tabs.
"""
VCDAT_LEFT_SIDEBAR_ID = "left-side-bar-vcdat"
VCDAT_ICON_CLASS = "jp-icon-vcdat"


class MainPage(ActionsPage):

    # Menu and left tab names listed below
    TOP_MENUS = ["File", "Edit", "View", "Run",
                 "Kernel", "Tabs", "Settings", "Help"]
    LEFT_TABS = [
        "FileBrowser",
        "Running",
        "Commands",
        "VCDAT",
        "OpenTabs",
        # "ExtManager", # This tab is disabled by default
    ]

    def __init__(self, driver, server):
        print("...Validate MainPage...")
        super(MainPage, self).__init__(driver, server)

    def _validate_page(self):
        # Ensure that the left side panel is wide enough

        assert self.adjust_sidebar(400), "The sidebar resize failed..."
        # validate Main page is displaying a 'Jupyter' Logo and VCDAT icon
        self.jupyter_icon().silent().sleep(2).click()

    # ----------  TOP LEVEL LOCATORS (Always accessible on page)  --------------
    def jupyter_icon(self):
        return self.locator("jp-MainLogo", "id", "Jupyter Lab Logo")

    def vcdat_icon(self):
        return self.left_tab("VCDAT")

    # Provides the locator for top menus.
    # Items available: File, Edit, View, Run, Kernel, Tabs, Settings, Help
    def top_menu(self, name):

        if name not in self.TOP_MENUS:
            raise ValueError(
                "Only the following names are valid: {}".format(self.TOP_MENUS)
            )

        loc = "//div[@class='p-MenuBar-itemLabel'][contains(text(),'{n}')]".format(
            n=name
        )
        return self.locator(loc, "xpath", "{} Menu".format(name))

    # Provides locator for tabs on the left of main page.
    # Valid tabs: FileBrowser, Running, Commands, VCDAT, OpenTabs, ExtManager
    def left_tab(self, tab):
        if tab not in self.LEFT_TABS:
            raise ValueError(
                "Only the following names are valid: {}".format(self.LEFT_TABS)
            )

        # Dictionary contains the data-id and a description for each left tab
        Tabs = {
            "FileBrowser": ["filebrowser", "FileBrowser Tab"],
            "Running": ["jp-running-sessions", "Running Session Tab"],
            "Commands": ["command-palette", "Command Palette Tab"],
            "VCDAT": [VCDAT_LEFT_SIDEBAR_ID, "VCDAT Tab"],
            "OpenTabs": ["tab-manager", "Open Tabs Icon"],
            "ExtManager": ["extensionmanager.main-view", "Extension Manager Tab"],
        }
        tab_id = Tabs[tab][0]
        tab_descr = Tabs[tab][1]
        loc = "//div[@id='jp-main-content-panel']//li[@data-id='{f}']".format(
            f=tab_id)
        return self.locator(loc, "xpath", tab_descr)

    # Provides a locator for a button shown on a popup dialog in main screen
    # provided the text of the button matches
    def dialog_btn(self, text, descr=""):
        if descr == "":
            descr = "'{}' dialog button".format(text)
        loc = "//div[@class='p-Widget jp-Dialog']//button/div[@class="
        loc += "'jp-Dialog-buttonLabel'][contains(text(),'{}')]".format(text)
        return self.locator(loc, "xpath", descr)

    # Will enter text into an input shown on a popup dialog in main screen.
    # Note, this may not always work and will only select the first input found
    def dialog_input(self, label, descr=""):
        if descr == "":
            descr = "'{}' input field".format(label)
        loc = "//div[contains(@class,'jp-Dialog')]/input"
        loc += "[contains(@class,'jp-mod-styled')]"
        return self.locator(loc, "xpath", descr)

    # -------------------------  SUB LEVEL LOCATORS  ---------------------------

    # Provides the locator for an item within a top menu. top_menu -> item
    # Example: top_menu_item("File","Export As") returns locator for 'Export As' located in 'File' top menu.
    def top_menu_item(self, parent, name, descr=""):
        if descr == "":
            descr = name
        parent = self.top_menu(parent)
        loc = "//div[@class='p-Widget p-Menu p-MenuBar-menu']//li/div[@class="
        loc += "'p-Menu-itemLabel'][contains(text(),'{n}')]".format(n=name)
        return self.locator(loc, "xpath", descr, parent)

    # Provides the locator for an item within a sub-menu. top_menu -> sub_menu -> item
    def sub_menu_item(self, top_menu, sub_menu, item, descr=""):
        if descr == "":
            descr = item

        if self.browser == "firefox":
            print("---Firefox steps---")
            # Firefox needed steps to correctly click the element
            self.top_menu(top_menu).simple_click()
            self.top_menu_item(top_menu, sub_menu).move_to(0, 20).click()

        requires = self.top_menu_item(top_menu, sub_menu)
        loc = "//div[@class='p-Widget p-Menu']//li/div[@class='p-Menu-itemLabel']"
        loc += "[contains(text(),'{i}')]".format(i=item)
        return self.locator(loc, "xpath", descr, requires)

    # ----------------------------- PAGE FUNCTIONS -----------------------------

    # Will drag the main split panel handle to the specified width. Returns True
    # if the adjustment was successful.
    def adjust_sidebar(self, width):
        loc = "//*[@id='jp-main-split-panel']/div[contains(@class,'p-SplitPanel-handle')]"
        divider = self.locator(loc, "xpath", "Split Panel Bar").get()
        current_width = divider.get_attribute("style")
        # Will extract the 'left: 1234.234' value from string
        regex = r"left: (\d+\.\d+|\d+)"
        if current_width is not None:
            result = re.search(regex, current_width)
            if result:
                current_width = re.search(regex, current_width).group(1)
                current_width = float(current_width)
                adjust = width - current_width
                print("Current width is: {}, adjusting width by: {}".format(
                    current_width, adjust))

                # Adjust only if necessary
                if abs(adjust) > 1:
                    divider.drag_drop(adjust, 0)
                return True
            else:
                print("Regex result was None. Style attribute value: \
                {}".format(current_width))
                return False
        else:
            print("Divider attribute was None. \
                Divider locator: ".format(divider))
            return False

    # Will create a new notebook and rename it using the file menu
    def create_notebook(self, notebook_name):
        # Create notebook
        self.sub_menu_item("File", "New", "Notebook").click()
        self.dialog_btn("Select").attempt().click()
        self.rename_notebook(notebook_name)

    def rename_notebook(self, new_name):
        # Rename notebook
        self.top_menu_item("File", "Rename").click().sleep(2)
        self.dialog_input("Rename").enter_text(
            "{}.ipynb".format(new_name)).press_enter().sleep(2)
        self.dialog_btn("Overwrite").attempt().click().sleep(2)

    # Will save current notebook if one is open

    def save_notebook(self):
        self.top_menu_item("File", "Save Notebook").attempt().click()

    # Will remove the notebook with specified name, do not include extension
    def remove_notebook(self, notebook_name):
        filename = "{}.ipynb".format(notebook_name)
        print("Removing file: {}".format(filename))
        os.remove(filename)

    # Will run all cells in current notebook, if one is open
    def run_notebook_cells(self):
        self.top_menu_item("Run", "Run All Cells").attempt().click()

    # Will make sure the specific left tab panel is open
    # Valid tabs: FileBrowser, Running, Commands, VCDAT, OpenTabs, ExtManager
    def open_left_tab(self, tab):
        if tab == "VCDAT":
            self.left_tab("FileBrowser").click()
        else:
            self.left_tab("VCDAT").click()
        print("Left Tab: {} Opened!".format(tab))
        self.left_tab(tab).click()

    # Starts the vcdat tutorial intro found in the 'Help' menu,
    # function below should work whether the help menu is currently open or not.
    def tutorial_start(self, name="VCDAT Tutorial: Introduction"):
        print("Starting tutorial: {}...".format(name))
        # Start the tutorial
        self.top_menu_item("Help", name).click()

    # Clicks the 'next' or 'finish' button in a vcdat tutorial. Will start the intro tutorial
    # if no tutorial was already started.
    def tutorial_next(self):
        loc = "//*[contains(@id,'react-joyride-step')]//"
        loc += "button[contains(@aria-label,'Next') or contains(@aria-label,'Finish')]"
        return self.locator(loc, "xpath", "Tutorial 'Next' Button")

    # Ends a tutorial early by clicking the 'skip' button, or 'Finish' button. Starts
    # intro tutorial if no tutorial was already started.
    def tutorial_skip(self):
        loc = "//*[contains(@id,'react-joyride-step')]//"
        loc += "button[contains(@aria-label,'Skip') or contains(@aria-label,'Finish')]"
        return self.locator(loc, "xpath", "Tutorial 'Skip' Button")

    # Shuts down the current kernel if one is active.
    def shutdown_kernel(self, verbose=True):
        if verbose:
            print("...shutdown kernel if needed...")
            self.top_menu("Kernel").click()
            self.top_menu_item(
                "Kernel", "Shut Down Kernel", "Shut Down Kernel Button"
            ).attempt().click()
        else:
            self.top_menu("Kernel").silent().click()
            self.top_menu_item(
                "Kernel", "Shut Down Kernel", "Shut Down Kernel Button"
            ).silent().attempt().click()

    # Shuts down all kernels if there are kernels to shut down.
    def shutdown_all_kernels(self, verbose=True):
        if verbose:
            print("...shutdown all kernels...")
            self.top_menu("Kernel").click()
            self.top_menu_item(
                "Kernel", "Shut Down All Kernels", "Shutdown All Kernels Button"
            ).attempt().click()
            self.dialog_btn("Shut Down All").attempt().click().sleep(3)
        else:
            self.top_menu("Kernel").silent().click()
            self.top_menu_item(
                "Kernel", "Shut Down All Kernels", "Shutdown All Kernels Button"
            ).silent().attempt().click()
            self.dialog_btn("Shut Down All").silent(
            ).attempt().click().sleep(3)
