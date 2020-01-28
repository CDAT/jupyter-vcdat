import time
from selenium.common.exceptions import NoSuchElementException
from ActionsPage import ActionsPage
from LoadVariablesPopUp import LoadVariablesPopUp


class FileBrowser(ActionsPage):

    def __init__(self, driver, server=None):
        super(FileBrowser, self).__init__(driver, server)

    def _validate_page(self):
        print("...FileBrowser.validate_page()...")
        file_name_header_locator = "#filebrowser div.jp-DirListing-headerItem"
        file_name_header_locator += ".jp-id-name span.jp-DirListing-headerItemText"
        self.find_element(file_name_header_locator, "css")

    def double_click_on_a_file(self, fname, expect_file_load_error=True):
        time.sleep(3)
        file_locator = "#filebrowser li.jp-DirListing-item[title~='{f}']".format(
            f=fname)
        file_element = self.find_element(file_locator, "css")
        self.move_to_double_click(file_element)
        time.sleep(self._delay)

        if expect_file_load_error:
            print("...click on the File Load Error OK button")
            print("...doing WebDriverWait...till the element is clickable")
            file_popup_modal_locator = "div.p-Widget.jp-Dialog div.p-Widget.p-Panel "
            file_popup_modal_locator = "div.jp-Dialog-footer button.jp-mod-accept"
            dismiss_btn = self.find_element(file_popup_modal_locator, "css")
            self.move_to_click(dismiss_btn)

        time.sleep(self._delay)

        # Select Kernel Popup if it exists
        try:
            accept_button = self.find_element(file_popup_modal_locator, "css")
            print("Click accept button")
            if accept_button is not None:
                self.move_to_click(accept_button)
        except NoSuchElementException:
            pass

        load_variables_pop_up = LoadVariablesPopUp(self.driver, None)
        return load_variables_pop_up
