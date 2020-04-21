from LoadVariablesPopUp import LoadVariablesPopUp
from MainPage import MainPage

"""
PageObject for the main page of JupyterLab application
Contains locator functions for all menu items and left tabs.
"""


class FileBrowser(MainPage):
    def __init__(self, driver, server=None):
        print("...Validate FileBrowser Page...")
        super(FileBrowser, self).__init__(driver, server)

    def _validate_page(self):
        print("...Validate FileBrowser...")
        # Make sure file browser can open
        self.open_left_tab("FileBrowser")

    # This will return an open variables popup given an appropriate .nc file
    # to open in the file browser.
    def open_variable_loader(self, fname, notebook_name):
        self.create_notebook(notebook_name)
        self.open_file(fname)
        return LoadVariablesPopUp(self.driver)

    # ----------  TOP LEVEL LOCATORS (Always accessible on page)  --------------

    # Provides locator for an icon in the file browser
    def file_browser_button(self, icon_title):
        loc = "//*[@id='filebrowser']//button[@title='{}']".format(icon_title)
        requires = self.action(self.open_left_tab, "FileBrowser")
        return self.locator(loc, "xpath", icon_title, requires)

    # Provides locator for the small folder icon found in the browser breadcrumbs
    def folder_icon(self):
        loc = "span.jp-BreadCrumbs-home"
        requires = self.action(self.open_left_tab, "", "FileBrowser")
        return self.locator(loc, "css", "Folder Icon in FileBrowser", requires).needs_to_be("visible")

    # Returns the locator for a file browser item (like a file)
    def file_browser_item(self, item):
        loc = "#filebrowser li.jp-DirListing-item[title~='{i}']".format(i=item)
        requires = self.folder_icon()
        return self.locator(loc, "css", "FileBrowser Item: {}".format(item), requires)

    def new_launcher_icon(self):
        return self.file_browser_button("New Launcher")

    def new_folder_icon(self):
        return self.file_browser_button("New Folder")

    def upload_files_icon(self):
        return self.file_browser_button("Upload Files")

    def refresh_file_list_icon(self):
        return self.file_browser_button("Refresh File List")

    # ----------------------------- PAGE FUNCTIONS -----------------------------

    # Will open a file in the file browser
    def open_file(self, fname, delay=5):
        print("Opening file {}".format(fname))
        self.file_browser_item(fname).double_click()
        # File Load Error popup may show
        self.dialog_btn(
            "Dismiss", "File Load Error PopUp").attempt().click()
        # Kernel Select popup may show
        self.dialog_btn(
            "Select", "Kernel Select PopUp").attempt().click().sleep(delay)
