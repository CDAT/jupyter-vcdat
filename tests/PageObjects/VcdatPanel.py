from MainPage import MainPage


"""
PageObject for the main page of JupyterLab application
Contains locator functions for all menu items and left tabs.
"""


class VcdatPanel(MainPage):
    def __init__(self, driver, server=None):
        super(VcdatPanel, self).__init__(driver, server)

    def _validate_page(self):
        print("...Validate VcdatPanel...")
        self.vcdat_icon()  # Make sure vcdat panel can open

    # ----------  TOP LEVEL LOCATORS (Always accessible on page)  --------------

    def main_panel(self):
        loc = "left-sidebar-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "id", "VCDAT Top Panel", requires)

    def top_panel(self):
        loc = "vcsmenu-main-vcdat"
        return self.main_panel().find_child(loc, "class", "VCDAT Top Panel")

    def plot_btn(self):
        loc = "vcsmenu-plot-btn-vcdat"
        return self.top_panel().find_child(loc, "class", "TESTING")

    def export_btn(self):
        loc = "vcsmenu-export-btn-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "class", "Export Button", requires)

    def clear_btn(self):
        loc = "vcsmenu-clear-btn-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "class", "Clear Button", requires)

    def load_variables_file_btn(self):
        loc = "varmenu-load-variables-file-btn-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "class", "File Load Button", requires)

    def load_variables_path_btn(self):
        loc = "varmenu-load-variables-path-btn-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "class", "Path Load Button", requires)

    def overlay_switch(self):
        loc = "vcsmenu-overlay-switch-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "id", "Overlay Switch", requires)

    def sidecar_switch(self):
        loc = "vcsmenu-sidecar-switch-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "id", "Sidecar Switch", requires)

    def plot_type_btn(self):
        loc = "graphics-dropdown-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "class", "Plot Type Button", requires)

    def colormap_btn(self):
        loc = "colormap-dropdown-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "class", "Colormap Button", requires)

    def template_btn(self):
        loc = "template-dropdown-vcdat"
        requires = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "class", "Template Button", requires)

    # -------------------------  SUB LEVEL LOCATORS  ---------------------------

    # Locator will only show up if an existing, non-vcdat notebook is opened
    def sync_notebook_btn(self, notebook_name="sync_notebook"):
        loc = "varmenu-sync-btn-vcdat"

        # If locator not found, then make sure vcdat panel open
        req = self.action(self.open_left_tab, "VCDAT")
        return self.locator(loc, "class", "Plot Button", req)

    # Gets locator for a graphics method group in the Plot Type drop-down
    def plot_type_group(self, group):
        loc = "button.graphics-method-group-vcdat[value='{}']".format(group)
        requires = self.plot_type_btn()
        return self.locator(
            loc, "css", "Graphic Group Option: {}".format(group), requires
        )

    # Gets locator for a graphics method item in the Plot Type drop-down
    def plot_type_item(self, group, item):
        loc = "button.graphics-method-item-vcdat[value~='{}']".format(item)
        descr = "Graphic Option Item: {}".format(item)
        requires = self.plot_type_group(group)
        return self.locator(loc, "css", descr, requires)

    # Gets locator for 'close' button shown when selecting graphic method group
    def plot_type_close_btn(self, group="boxfill"):
        loc = "button.graphics-close-btn-vcdat"
        # Select plot group, to show close
        require = self.plot_type_group(group)
        return self.locator(loc, "css", "Graphic Group Close", require)

    # Gets the locator for the 'copy' button shown when plot type has been set
    def plot_type_copy_btn(self):
        loc = "button.graphics-copy-btn-vcdat"
        requires = self.plot_type_item("boxfill", "default")
        return self.locator(loc, "css", "Graphic Copy Button", requires)

    # Gets the locator for the 'copy' button shown when plot type has been set
    # Will fail if plot type was not set (therefore no plot to copy from)
    def plot_type_copy_cancel_btn(self):
        loc = "button.graphics-cancel-btn-vcdat"
        return self.locator(loc, "css", "Graphic Copy Cancel Button")

    # Gets locator for the name input of the plot type copy feature
    #
    def plot_type_copy_name_input(self):
        loc = "input.graphics-name-input-vcdat"
        return self.locator(loc, "css", "Graphic Copy Name Input")

    def plot_type_copy_name_enter_btn(self):
        loc = "button.graphics-enter-btn-vcdat"
        requires = self.plot_type_copy_btn()
        return self.locator(loc, "css", "Graphics Enter Name Button", requires)

    # Gets locator for an item in colormap drop-down
    def colormap_item(self, item):
        loc = "button.colormap-dropdown-item-vcdat[value~='{}']".format(item)
        self.colormap_btn().click().sleep(1)
        return self.locator(loc, "css", "Colormap Option: {}".format(item))

    # Gets locator for an item in layout template drop-down
    def layout_template_item(self, item):
        loc = "button.template-item-vcdat[value~='{}']".format(item)
        self.template_btn().click().sleep(1)
        return self.locator(loc, "css", "Template Option: {}".format(item))

    # ---------------------------  VCDAT Functions  ----------------------------

    # Opens a notebook and syncs it to work with vcdat
    def sync_new_notebook(self, notebook_name):
        self.create_notebook(notebook_name)
        self.open_left_tab("VCDAT")
        self.sync_notebook_btn().click().sleep(3)  # Wait for imports to load


"""
    def click_on_plot(self):
        element = self.locate_plot()
        self.scroll_click(element)
        time.sleep(2)

    def click_on_export_plot(self):
        element = self.locate_export_plot()
        self.move_to_click(element)
        save_plot_popup = SavePlotPopUp(self.driver, None)
        return save_plot_popup

    def click_on_clear(self):
        element = self.locate_clear()
        self.move_to_click(element)

    def click_on_load_variables_by_file(self):
        element = self.locate_load_variables_by_file()
        self.move_to_click(element)
        file_browser = FileBrowser(self.driver, None)
        return file_browser

    def click_on_load_variables_by_path(self):
        element = self.locate_load_variables_by_path()
        self.move_to_click(element)

    def click_on_sync_notebook(self):
        element = self.locate_sync_notebook_button()
        # self.move_to_click(element)
        self.move_to_click(element)

    def click_on_select_plot_type(self):
        element = self.locate_select_plot_type()
        # self.move_to_click(element)
        self.scroll_click(element)

    def click_on_select_colormap(self):
        element = self.locate_select_colormap()
        # self.move_to_click(element)
        self.scroll_click(element)

    def click_on_select_a_template(self):
        element = self.locate_select_a_template()
        # self.move_to_click(element)
        self.scroll_click(element)


    def _get_plot_type_elements(self):
        plot_type_elements_class = "graphics-dropdown-item-vcdat"
        try:
            plot_type_elements = self.find_elements(
                plot_type_elements_class, "class")
            # for e in plot_type_elements:
            #    print("plot_type_element: '{}'".format(e.text))
            return plot_type_elements
        except NoSuchElementException as e:
            print("FAIL..._get_plot_type_elements...")
            raise e

    def _get_template_elements(self):
        template_elements_class = "template-item-vcdat"
        try:
            template_elements = self.find_elements(
                template_elements_class, "class")
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

    #
    # Overlay Mode
    #
    # REVISIT -- need a way to check if the overlay mode is selected.
    def _click_on_overlay_mode(self):
        overlay_mode_id = "vcsmenu-overlay-mode-switch-vcdat"
        try:
            overlay_mode = self.find_element(overlay_mode_id, "id")
            print("FOUND 'Capture Provenance' selector")
            self.move_to_click(overlay_mode)
            # time.sleep(self._delay)
        except NoSuchElementException as e:
            print("Could not find 'Capture Provenance' selector")
            raise e

    def select_overlay_mode(self):
        try:
            self._click_on_overlay_mode()
            # time.sleep(self._delay)
        except NoSuchElementException as e:
            print("Could not select 'Capture Provenance'")
            raise e

    def deselect_overlay_mode(self):
        try:
            self._click_on_overlay_mode()
        except NoSuchElementException as e:
            print("Could not deselect 'Capture Provenance'")
            raise e

    #
    # variable related methods
    #
    def _click_on_variable(self, var):
        var_class = "varmini-name-btn-vcdat"
        try:
            var_element = self.find_element(var_class, "class")
            print("FOUND 'Capture Provenance' selector")
            state = var_element.get_attribute('class')
            print("xxx xxx xxx xxx DEBUG...state: '{}'".format(state))
            self.move_to_click(var_element)
        except NoSuchElementException as e:
            print("Could not find variable '{}'".format(var))
            raise e

    def select_variable(self, var):
        try:
            self._click_on_variable(var)
        except NoSuchElementException as e:
            print("Could not select 'Capture Provenance'")
            raise e

    def deselect_variable(self, var):
        try:
            self._click_on_variable(var)
        except NoSuchElementException as e:
            print("Could not deselect 'Capture Provenance'")
            raise e

    def _locate_edit_button_for_variable(self, var):
        var_menu_class = "varmenu-varlist-vcdat"
        var_row_locator = ".//div[contains(@class, 'varmini-main-vcdat')]"
        var_button_locator = ".//button[contains(@class, 'varmini-name-btn-vcdat')]"
        edit_button_locator = ".//button[contains(@class, 'varmini-edit-btn-vcdat')]"
        try:
            var_menu = self.find_element(var_menu_class, "class")
            var_rows = var_menu.find_elements(var_row_locator, "class")
            i = 0
            for var_row in var_rows:
                var_button = var_row.find_element(var_button_locator, "xpath")
                print("DEBUG...var_button.text: '{}'".format(var_button.text))
                if var_button.text == var:
                    print("FOUND the row for variable '{}'".format(var))
                    break
                else:
                    i += 0
            if i < len(var_rows):
                edit_button = var_rows[i].find_element(
                    edit_button_locator, "xpath")
                print("FOUND edit button for variable '{}'".format(var))
                return edit_button
            else:
                print("Error...invalid variable '{}'".format(var))
                # REVISIT -- raise an exception -- test error
        except NoSuchElementException as e:
            print("FAIL..._locate_row_for_variable, var: '{}'".format(var))
            raise e

    def click_on_edit_button_for_variable(self, var):
        try:
            button = self._locate_edit_button_for_variable(var)
            self.move_to_click(button)
            time.sleep(self._delay)
        except NoSuchElementException as e:
            print("Could not find 'edit' button for variable '{}'".format(var))
            raise e

        edit_axis_popup = EditAxisPopUp(self.driver, None)
        return edit_axis_popup

"""
