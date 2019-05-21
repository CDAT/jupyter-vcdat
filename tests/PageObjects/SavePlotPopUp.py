import os
import time
from ActionsPage import ActionsPage
from selenium.common.exceptions import NoSuchElementException


class SavePlotPopUp(ActionsPage):

    def __init__(self, driver, server):
        super(SavePlotPopUp, self).__init__(driver, server)
        self.exported_filename = None
        self.exported_format = None

    def _validate_page(self):
        print("...SavePlotPopUp.validate_page()...")
        # title_locator = "//div[@class='modal-header']/h5[contains(text(), 'Save Plot')]"
        title_locator = "//h5[contains(text(), 'Save Plot')]"
        # title_locator = "//div[@class='modal-header']"
        self.find_element_by_xpath(title_locator, "'Save Plot' header")

    def input_plot_file_name(self, plot_name):
        input_plot_class = "export-name-input-vcdat"
        try:
            input_area = self.find_element_by_class(input_plot_class,
                                                    "Save Plot name input area")
            self.enter_text(input_area, plot_name)
            self.exported_filename = plot_name
        except NoSuchElementException as e:
            print("Could not find Save Plot input area element")
            raise e

    def select_export_format(self, export_format):
        export_format_class = "export-format-btn-vcdat"
        try:
            export_formats = self.find_elements_by_class(export_format_class,
                                                         "plot export format")
            i = 0
            for f in export_formats:
                if f.text == export_format:
                    self.move_to_click(f)
                    self.exported_format = export_format.lower()
                    break
                else:
                    i += 1
            if i >= len(export_formats):
                print("Error: invalid export format '{}'".format(export_format))
                # REVISIT - raise an exception
        except NoSuchElementException as e:
            print("Could not find export format elements")
            raise e

    def click_on_export(self):
        export_button_class = "export-button-vcdat"
        try:
            export_button = self.find_element_by_class(export_button_class,
                                                       "'Export' button")
            self.move_to_click(export_button)
        except NoSuchElementException as e:
            print("Could not find 'Export' button")
            raise e
        # verify that the exported file exists
        filename = "{f}.{suffix}".format(f=self.exported_filename,
                                         suffix=self.exported_format)
        counter = 0
        file_exists = False
        while file_exists is False and counter <= 5:
            file_exists = os.path.isfile(filename)
            if file_exists is False:
                time.sleep(0.5)
                counter += 1

        assert file_exists
        time.sleep(2)
        print("Plot is exported to: {}".format(filename))

    def _click_on_custom_dimensions(self):
        custom_dimensions_id = "export-dimension-switch-vcdat"
        try:
            custom_dimension = self.find_element_by_id(custom_dimensions_id,
                                                       "Custom dimensions")
            print("FOUND 'Custom dimensions' selector")
            self.move_to_click(custom_dimension)
            time.sleep(5)
        except NoSuchElementException as e:
            print("Could not find 'Custom dimensions' selector")
            raise e

    def select_custom_dimensions(self):
        try:
            self._click_on_custom_dimensions()
            time.sleep(1)
        except NoSuchElementException as e:
            print("Could not select 'Custom dimensions'")
            raise e

    def deselect_custom_dimensions(self):
        try:
            self._click_on_custom_dimensions()
        except NoSuchElementException as e:
            print("Could not deselect 'Custom dimensions'")
            raise e

    def click_on_custom_dimensions_unit(self, unit):
        unit_class = "export-unit-btn-vcdat"
        try:
            dimension_units = self.find_elements_by_class(unit_class,
                                                          "export units")
            i = 0
            for u in dimension_units:
                if u.text == unit:
                    self.move_to_click(u)
                    break
                else:
                    i += 1
            if i >= len(dimension_units):
                print("Error: invalid unit '{}'".format(unit))
                # REVISIT  - raise an exception
        except NoSuchElementException as e:
            print("Could not find export format elements")
            raise e

    def _enter_unit_dimension(self, dimension, the_dimension):
        """
        enter the specified the_dimension to the unit input area.
        dimension: "width" or "height"
        the_dimension: numeric specifying the desired dimension
        """
        mapping = {"width": "export-width-input-vcdat",
                   "height": "export-height-input-vcdat"}
        try:
            input_area = self.find_element_by_class(mapping[dimension],
                                                    "'{}' unit dimension input area".format(dimension))
            print("FOUND input area for '{}' dimension".format(dimension))
            self.enter_text(input_area, the_dimension)

        except NoSuchElementException as e:
            print("Could not find input area for unit '{}' dimension".format(dimension))
            raise e

    def enter_unit_width(self, the_dimension):
        self._enter_unit_dimension('width', the_dimension)

    def enter_unit_height(self, the_dimension):
        self._enter_unit_dimension('height', the_dimension)

    #
    # REVISIT - how do I check if capture provenance is selected
    #
    def _click_on_capture_provenance(self):
        capture_provenance_id = "export-capture-provenance-switch-vcdat"
        try:
            capture_provenance = self.find_element_by_id(capture_provenance_id,
                                                         "Capture Provenance")
            print("FOUND 'Capture Provenance' selector")
            self.move_to_click(capture_provenance)
            time.sleep(5)
        except NoSuchElementException as e:
            print("Could not find 'Capture Provenance' selector")
            raise e

    def select_capture_provenance(self):
        try:
            self._click_on_capture_provenance()
            time.sleep(1)
        except NoSuchElementException as e:
            print("Could not select 'Capture Provenance'")
            raise e

    def deselect_capture_provenance(self):
        try:
            self._click_on_capture_provenance()
        except NoSuchElementException as e:
            print("Could not deselect 'Capture Provenance'")
            raise e
