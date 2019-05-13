from Actions import Actions
from selenium.common.exceptions import NoSuchElementException


class LoadVariablesPopUp(Actions):

    _var_name_class = "varcard-name-btn-vcdat"
    _var_axes_class = "varcard-axes-btn-vcdat"

    def __init__(self, driver, server):
        super(LoadVariablesPopUp, self).__init__(driver, server)

    def _validate_page(self):
        load_variables_locator = "//div[@class='modal-header']//h5[contains(text(), 'Load Variable')]"
        print("...LoadVariablePopUp.validate_page()...")
        self.find_element_by_xpath(load_variables_locator, "'Load Variable(s)' header")

    def _get_var_row_elements(self):
        var_cards_class = "varcard-main-vcdat"
        try:
            var_rows = self.find_elements_by_class(var_cards_class, "varcard rows")
            print("DEBUG..._get_var_row_elements()...num of var_rows: {}".format(len(var_rows)))
            return var_rows
        except NoSuchElementException as e:
            print("NOT finding any variables button...")
            raise e

    def click_on_var(self, var):
        print("...click_on_var {}".format(var))
        locator = "//button[contains(@class, '{cl}') and contains(text(), '{var}')]".format(cl=self._var_name_class,
                                                                                            var=var)
        try:
            element = self.find_element_by_xpath(locator, "'{}' button".format(var))
            self.move_to_click(element)
            # time.sleep(5)
        except NoSuchElementException as e:
            print("FAIL...click_on_var, var: {}".format(var))
            raise e

    def click_on_var_axes(self, var):
        print("...click_on_var_axes for '{}' variable".format(var))
        rows = self._get_var_row_elements()
        i = 0
        for r in rows:
            try:
                locator = ".//button[contains(@class, '{}')]".format(self._var_name_class)
                var_button = r.find_element_by_xpath(locator)
                if var_button.text == var:
                    print("FOUND '{}' variable button")
                    print("click on '{}' var".format(var))
                    self.move_to_click(var_button)
                    break
            except NoSuchElementException as e:
                print("Cannot find '{}'".format(self._var_name_class))
                raise e
            i += 1
        try:
            locator = ".//button[contains(@class, '{}')]".format(self._var_axes_class)
            var_axes_button = rows[i].find_element_by_xpath(locator)
            print("FOUND '{}' axes".format(var))
            self.move_to_click(var_axes_button)
        except NoSuchElementException as e:
            print("Cannot find '{}'".format(self._var_axes_class))
            raise e

    def click_on_load(self):
        print("...click_on_load...")
        load_button_class = "varloader-load-btn-vcdat"
        locator = "//button[contains(@class, '{}')]".format(load_button_class)
        try:
            load_button = self.find_element_by_xpath(locator, "'Load' button")
            self.move_to_click(load_button)
        except NoSuchElementException as e:
            print("Cannot find 'Load' button in the 'Load Variables' pop up")
            raise e
