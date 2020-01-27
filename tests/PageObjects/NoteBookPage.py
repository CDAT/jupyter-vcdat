from MainPage import MainPage
from selenium.common.exceptions import NoSuchElementException


class NoteBookPage(MainPage):
    def __init__(self, driver, server=None):
        super(NoteBookPage, self).__init__(driver, server)

    def _validate_page(self):
        print("...NoteBookPage.validatePage()")
        # no op for now

    def new_notebook(self, launcher_title, notebook_name):
        print("...NoteBookPage.new_notebook...")
        self.click_on_folder_tab()
        self.click_on_notebook_launcher(launcher_title)
        self.rename_notebook(notebook_name)
        self.notebook_name = notebook_name

    def get_notebook_name(self):
        return(self.notebook_name)

    def rename_notebook(self, new_name):
        self.click_on_top_menu_item("File")

        data_command = "docmanager:rename"
        self.click_on_submenu_with_data_command(data_command,
                                                "Rename Notebook")
        rename_notebook_input_locator = "//input[@class='jp-mod-styled']"
        input_area = self.find_element_by_xpath(rename_notebook_input_locator,
                                                "Rename Notebook input area")
        self.enter_text(input_area, new_name)

    def save_current_notebook(self):
        print("...save_current_notebook...")
        found = False
        n_try = 0
        while not found and n_try <= 1:
            self.click_on_top_menu_item("File")
            data_command = "docmanager:save"
            try:
                self.click_on_submenu_with_data_command(data_command,
                                                        "Save Notebook")
                found = True
            except NoSuchElementException:
                print("Nothing to save in the notebook or did not find submenu")
            n_try = n_try + 1

    def save_current_notebookORIG(self):
        print("...save_current_notebook...")
        self.click_on_top_menu_item("File")
        data_command = "docmanager:save"
        try:
            self.click_on_submenu_with_data_command(data_command,
                                                    "Save Notebook")
        except NoSuchElementException:
            print("Nothing to save in the notebook")

    def close_current_notebook(self):
        print("...close_current_notebook...")
        self.click_on_top_menu_item("File")
        data_command = "filemenu:close-and-cleanup"
        self.click_on_submenu_with_data_command(data_command,
                                                "Close and Shutdown")
        # check if we are getting "Close without saving?" pop up
        close_without_saving_ok_locator = "//div[contains(text(), 'OK')]"
        try:
            ok_element = self.find_element_by_xpath(close_without_saving_ok_locator,
                                                    "Close Notebook 'OK' button")
            print("FOUND 'Close without saving?' pop up, click 'OK'")
            self.move_to_click(ok_element)
        except NoSuchElementException:
            print("No 'Close without saving?' pop up")
