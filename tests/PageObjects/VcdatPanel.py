import time

from selenium.common.exceptions import NoSuchElementException

from Actions import Actions
from Actions import InvalidPageException
from FileBrowser import FileBrowser
from SavePlotPopUp import SavePlotPopUp


class VcdatPanel(Actions):

    def __init__(self, driver, server=None):
        super(VcdatPanel, self).__init__(driver, server)

    def _validate_page(self):
        print("...VcdatPanel.validate_page()...")
        try:
            self.locate_plot()
        except NoSuchElementException:
            raise InvalidPageException

    def locate_plot(self):
        return self.find_element_by_class("vcsmenu-plot-btn-vcdat",
                                          "'Plot' button")

    def locate_export_plot(self):
        return self.find_element_by_class("vcsmenu-export-btn-vcdat",
                                          "'Export Plot' button")

    def locate_clear(self):
        return self.find_element_by_class("vcsmenu-clear-btn-vcdat",
                                          "'Clear' button")

    def locate_load_variables(self):
        return self.find_element_by_class("varmenu-load-variables-btn-vcdat",
                                          "'Load Variable(s)' button")

    def locate_select_plot_type(self):
        return self.find_element_by_class("graphics-dropdown-vcdat",
                                          "'Select Plot Type' button")

    def locate_select_a_template(self):
        return self.find_element_by_class("template-dropdown-vcdat",
                                          "'Select A Template' button")

    def click_on_plot(self):
        element = self.locate_plot()
        self.move_to_click(element)

    def click_on_export_plot(self):
        element = self.locate_export_plot()
        self.move_to_click(element)
        save_plot_popup = SavePlotPopUp(self.driver, None)
        return save_plot_popup

    def click_on_clear(self):
        element = self.locate_clear()
        self.move_to_click(element)

    def click_on_load_variables(self):
        element = self.locate_load_variables()
        self.move_to_click(element)
        file_browser = FileBrowser(self.driver, None)
        return file_browser

    def click_on_select_plot_type(self):
        element = self.locate_select_plot_type()
        self.move_to_click(element)

    def click_on_select_a_template(self):
        element = self.locate_select_a_template()
        self.move_to_click(element)

    def _get_plot_type_elements(self):
        plot_type_elements_class = "graphics-dropdown-item-vcdat"
        try:
            plot_type_elements = self.find_elements_by_class(plot_type_elements_class,
                                                             "plot type elements")
            # for e in plot_type_elements:
            #    print("plot_type_element: '{}'".format(e.text))
            return plot_type_elements
        except NoSuchElementException as e:
            print("FAIL..._get_plot_type_elements...")
            raise e

    def _get_template_elements(self):
        template_elements_class = "template-item-vcdat"
        try:
            template_elements = self.find_elements_by_class(template_elements_class,
                                                            "template elements")
            # for t in template_elements:
            #     print("template_element: '{}'".format(t.text))
            return template_elements
        except NoSuchElementException as e:
            print("FAIL..._get_template_elements...")
            raise e

    def select_a_plot_type(self, plot_type):
        try:
            self.click_on_select_plot_type()
        except NoSuchElementException as e:
            print("FAIL...click_on_select_plot_type()")
            raise e
        try:
            plot_type_elements = self._get_plot_type_elements()
            i = 0
            for e in plot_type_elements:
                if e.text == plot_type:
                    print("FOUND plot type '{}'".format(plot_type))
                    self.scroll_click(e)
                    break
                else:
                    i += 1
            if i >= len(plot_type_elements):
                print("Invalid plot type '{}'".format(plot_type))
                # REVISIT raise an exception
        except NoSuchElementException as e:
            print("FAIL..._get_plot_type_elements()")
            raise e

    def select_a_template(self, template):
        try:
            self.click_on_select_a_template()
        except NoSuchElementException as e:
            print("FAIL...click_on_select_a_template()")
            raise e
        try:
            template_elements = self._get_template_elements()
            i = 0
            for t in template_elements:
                if t.text == template:
                    print("FOUND template '{}'".format(template))
                    self.scroll_click(t)
                    break
                else:
                    i += 1
            if i >= len(template_elements):
                print("Invalid template '{}'".format(template))
                # REVISIT raise an exception
        except NoSuchElementException as e:
            print("FAIL..._get_template_elements()")
            raise e

    # REVISIT -- need a way to check if the overlay mode is selected.
    def _click_on_overlay_mode(self):
        overlay_mode_id = "vcsmenu-overlay-mode-switch-vcdat"
        try:
            overlay_mode = self.find_element_by_id(overlay_mode_id,
                                                   "Capture Provenance")
            print("FOUND 'Capture Provenance' selector")
            self.move_to_click(overlay_mode)
            time.sleep(5)
        except NoSuchElementException as e:
            print("Could not find 'Capture Provenance' selector")
            raise e

    def select_overlay_mode(self):
        try:
            self._click_on_overlay_mode()
            time.sleep(1)
        except NoSuchElementException as e:
            print("Could not select 'Capture Provenance'")
            raise e

    def deselect_overlay_mode(self):
        try:
            self._click_on_overlay_mode()
        except NoSuchElementException as e:
            print("Could not deselect 'Capture Provenance'")
            raise e
