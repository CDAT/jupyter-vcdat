from selenium.common.exceptions import NoSuchElementException

from Actions import Actions
from Actions import InvalidPageException
from FileBrowser import FileBrowser


class VcdatPanel(Actions):

    def __init__(self, driver, server=None):
        super(VcdatPanel, self).__init__(driver, server)

    def _validate_page(self):
        print("...VcdatPanel.validate_page()...")
        try:
            self.select_plot()
        except NoSuchElementException:
            raise InvalidPageException

    def select_plot(self):
        return self.find_element_by_class("vcsmenu-plot-btn-vcdat",
                                          "'Plot' button")

    def select_export_plot(self):
        return self.find_element_by_class("vcsmenu-export-btn-vcdat",
                                          "'Export Plot' button")

    def select_clear(self):
        return self.find_element_by_class("vcsmenu-clear-btn-vcdat",
                                          "'Clear' button")

    def select_load_variables(self):
        return self.find_element_by_class("varmenu-load-variables-btn-vcdat",
                                          "'Load Variable(s)' button")

    def select_select_plot_type(self):
        return self.find_element_by_class("graphics-dropdown-vcdat",
                                          "'Select Plot Type' button")

    def select_select_a_template(self):
        return self.find_element_by_class("template-dropdown-vcdat",
                                          "'Select A Template' button")

    def click_on_plot(self):
        element = self.select_plot()
        self.move_to_click(element)

    def click_on_export_plot(self):
        element = self.select_export_plot()
        self.move_to_click(element)

    def click_on_clear(self):
        element = self.select_clear()
        self.move_to_click(element)

    def click_on_load_variables(self):
        element = self.select_load_variables()
        self.move_to_click(element)
        file_browser = FileBrowser(self.driver, None)
        return file_browser

    def click_on_select_plot_type(self):
        element = self.select_select_plot_type()
        self.move_to_click(element)

    def click_on_select_a_template(self):
        element = self.select_select_a_template()
        self.move_to_click(element)
