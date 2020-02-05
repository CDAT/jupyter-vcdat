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
        self.click_on_notebook_launcher(launcher_title)
        self.rename_notebook(notebook_name)
        self.notebook_name = notebook_name

    def get_notebook_name(self):
        return(self.notebook_name)

    def rename_notebook(self, new_name):
        self.sub_menu_item("File", "Rename Notebook",
                           "Rename notebook button").click()
        rename_notebook_input_locator = "div.jp-Dialog div.jp-FileDialog input.jp-mod-styled"
        input_area = self.find_element(rename_notebook_input_locator, "css")
        print("Found input field and entering name...")
        self.enter_text(input_area, new_name)

    def save_current_notebook(self):
        print("...save_current_notebook...")
        try:
            self.sub_menu_item("File", "Save", "Save notebook button").click()
        except NoSuchElementException:
            print("Nothing to save in the notebook")

    def close_current_notebook(self):
        print("...close_current_notebook...")
        self.sub_menu_item("File", "Close and Shutdown",
                           "Close notebook button").click()
        # check if we are getting "Close without saving?" pop up
        close_without_saving_ok_locator = "//div[contains(text(), 'OK')]"
        try:
            ok_element = self.find_element(
                close_without_saving_ok_locator, "xpath")
            if ok_element is not None:
                print("FOUND 'Close without saving?' pop up, click 'OK'")
                self.move_to_click(ok_element)
        except NoSuchElementException:
            print("No 'Close without saving?' pop up")
