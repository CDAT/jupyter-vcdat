from LoadVariablesPopup import LoadVariablesPopup
from MainPage import MainPage

"""
PageObject for the main page of JupyterLab application
Contains locator functions for all menu items and left tabs.
"""


class FileBrowser(MainPage):

    def __init__(self, driver, server=None):
        super(FileBrowser, self).__init__(driver, server)

    def _validate_page(self):
        print("...Validate FileBrowser...")
        # Make sure file browser can open
        self.left_tab("FileBrowser")

    # This will return an open variables popup given an appropriate .nc file
    # to open in the file browser.
    def open_load_variables_popup(self, fname):
        self.open_file(fname)
        return LoadVariablesPopup(self.driver, self.server)

    # ----------  TOP LEVEL LOCATORS (Always accessible on page)  --------------

    # Provides locator for an icon in the file browser
    def file_browser_button(self, icon_title):
        loc = "//*[@id='filebrowser']//button[@title='{}']".format(icon_title)
        requires = self.action(self.open_left_tab, "FileBrowser")
        return self.locator(loc, "xpath", icon_title, requires)

    # Returns the locator for a file browser item (like a file)
    def file_browser_item(self, item):
        loc = "#filebrowser li.jp-DirListing-item[title~='{i}']".format(
            i=item)
        requires = self.action(
            self.open_left_tab, "", "FileBrowser")
        return self.locator(loc, "xpath", "FileBrowser Item: {}".format(item), requires)

    def new_launcher_icon(self):
        return self.file_browser_button("New Launcher")

    def new_folder_icon(self):
        return self.file_browser_button("New Folder")

    def upload_files_icon(self):
        return self.file_browser_button("Upload Files")

    def refresh_file_list_icon(self):
        return self.file_browser_button("Refresh File List")

    def folder_icon(self):
        loc = ("// *[@id='filebrowser']/div[contains(@class, 'jp-FileBrowser-crumbs')]"
               "/ span[contains(@class, 'jp-BreadCrumbs-home')]")
        requires = self.action(
            self.open_left_tab, "", "FileBrowser")
        return self.locator(loc, "xpath", "Folder Icon in FileBrowser", requires)

    # ----------------------------- PAGE FUNCTIONS -----------------------------

    # Will open a file in the file browser
    def open_file(self, fname):

        self.file_browser_item(fname).double_click().wait(2)
        # File Load Error popup may show
        self.dialog_button("Dismiss", "File Load Error PopUp").lazy().click()
        # Kernel Select popup may show
        self.dialog_button(
            "Select", "Kernel Select PopUp").lazy().click().wait(5)
