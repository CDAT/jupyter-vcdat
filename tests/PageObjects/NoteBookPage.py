import time

from MainPage import MainPage
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys


class NoteBookPage(MainPage):

    def __init__(self, driver, server=None):
        super(NoteBookPage, self).__init__(driver, server)
        self.new_notebook()

    def _validate_page(self):
        print("...NoteBookPage.validatePage()")

    def _click_on_new_notebook(self):
        print("...click on New Notebook...")
        # self.hover_over_tab('File')
        self.click_on_tab('File')
        # self.find_menu_item_from_tab_drop_down_and_click('New')
        notebook_locator_constraint = "@data-command='notebook:create-new'"
        self.find_menu_item_from_tab_drop_down_find_submenu_by_constraint('New', notebook_locator_constraint)

    def _click_on_new_notebookORIG(self):
        print("...click on New Notebook...")
        # self.hover_over_tab('File')
        self.click_on_tab('File')
        # self.find_menu_item_from_tab_drop_down_and_click('New')
        self.find_menu_item_from_tab_drop_down_find_submenu_and_click('New')

        # notebook_locator = "//li[@class='p-Menu-item'][@data-command='notebook:create-new']"
        notebook_locator_constraint = "@data-command='notebook:create-new'"
        self.find_menu_item_by_constraint_and_click(notebook_locator_constraint)

    def rename_notebook(self, new_nb_name):
        # look for the 'Rename Notebook...' under File tab menu
        self.click_on_tab('File')

        # rename notebook locator data-command
        loc = "docmanager:rename"
        self.find_menu_item_with_command_from_tab_drop_down_and_click(loc)

        # enter the new notebook name
        rename_notebook_input_locator = "//input[@class='jp-mod-styled']"
        input_area = self.driver.find_element_by_xpath(rename_notebook_input_locator)

        # click on the input area
        input_area.clear()
        action_chains = ActionChains(self.driver)
        action_chains.click(input_area).send_keys(new_nb_name).key_down(Keys.ENTER).perform()
        time.sleep(self._delay * 2)

    def new_notebook(self):
        self._click_on_new_notebook()
        self.select_kernel()

    def save_current_notebook(self):
        self.click_on_tab('File')
        # save notebook locator data-command
        print("...click on 'Save Notebook'...")
        loc = "docmanager:save"
        self.find_menu_item_with_command_from_tab_drop_down_and_click(loc)

    def close_current_notebook(self):
        self.click_on_tab('File')
        self.find_menu_item_from_tab_drop_down_and_click('Close Notebook')
        # check if we are getting "Close without saving?" pop up
        close_without_saving_ok_locator = "//div[contains(text(), 'OK')]"
        try:
            ok_element = self.driver.find_element_by_xpath(close_without_saving_ok_locator)
            print("FOUND 'Close without saving?' pop up, click 'OK'")
            ok_element.click()
            time.sleep(self._delay)
        except NoSuchElementException:
            print("No 'Close without saving?' pop up")

    def close(self):
        print("...closing a note book if there is any...")
        nb_locator = "//div[@class='p-TabBar-tabIcon jp-NotebookIcon']"
        try:
            self.driver.find_element_by_xpath(nb_locator)
            print("FOUND a notebook")
        except NoSuchElementException:
            print("NOT FINDING a notebook")
            return

        nb_divs = "//li[contains(@title, 'Name: Untitled')]//div[starts-with(@class, 'p-TabBar')]"
        try:
            elems = self.driver.find_elements_by_xpath(nb_divs)
            for e in elems:
                attr = e.get_attribute("class")
                if e.is_displayed() and e.is_enabled() and attr == 'p-TabBar-tabCloseIcon':
                    print("...click on note book close icon..., attr: {a}".format(a=attr))
                    action_chains = ActionChains(self.driver)
                    action_chains.move_to_element(e)
                    action_chains.click(e).perform()
                    time.sleep(self._delay)

        except NoSuchElementException:
            print("No notebook")

        # check if we are getting "Close without saving?" pop up
        close_without_saving_ok_locator = "//div[contains(text(), 'OK')]"
        try:
            ok_element = self.driver.find_element_by_xpath(close_without_saving_ok_locator)
            print("FOUND 'Close without saving?' pop up, click 'OK'")
            ok_element.click()
            time.sleep(self._delay)
        except NoSuchElementException:
            print("No 'Close without saving?' pop up")

    def enter_code(self, code_text):

        nb_code_area_locator1 = "//div[@class='CodeMirror-code' and @role='presentation']"
        nb_code_area_locator2 = "//pre[@class=' CodeMirror-line ']"
        nb_code_area_locator3 = "//span[@role='presentation']//span[@cm-text='']"
        locator = "{l1}{l2}{l3}".format(l1=nb_code_area_locator1,
                                        l2=nb_code_area_locator2,
                                        l3=nb_code_area_locator3)
        code_area_element = self.driver.find_element_by_xpath(locator)

        ActionChains(self.driver).click(code_area_element).perform()
        a = ActionChains(self.driver)
        a.send_keys(code_text).key_down(Keys.SHIFT).send_keys(Keys.ENTER).key_up(Keys.SHIFT)
        a.perform()
        time.sleep(self._delay)

    def enter_code_list(self, code_list):

        nb_code_area_locator1 = "//div[@class='CodeMirror-code' and @role='presentation']"
        nb_code_area_locator2 = "//pre[@class=' CodeMirror-line ']"
        nb_code_area_locator3 = "//span[@role='presentation']//span[@cm-text='']"
        locator = "{l1}{l2}{l3}".format(l1=nb_code_area_locator1,
                                        l2=nb_code_area_locator2,
                                        l3=nb_code_area_locator3)
        for code_line in code_list[:-1]:
            code_area_element = self.driver.find_element_by_xpath(locator)
            ActionChains(self.driver).click(code_area_element).perform()
            a = ActionChains(self.driver)
            a.send_keys(code_line).send_keys(Keys.ENTER).perform()

        code_area_element = self.driver.find_element_by_xpath(locator)
        ActionChains(self.driver).click(code_area_element).perform()
        a = ActionChains(self.driver)
        a.send_keys(code_list[-1]).key_down(Keys.SHIFT).send_keys(Keys.ENTER).key_up(Keys.SHIFT).perform()
