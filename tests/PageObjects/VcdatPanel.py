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
        requires = self.action(self.open_left_tab, "Open Left Tab", "VCDAT")
        return self.locator(loc, "id", "VCDAT Top Panel", requires).needs_to_be("visible")

    # The VCDAT top panel
    def top_panel(self):
        loc = "vcsmenu-main-vcdat"
        return self.main_panel().find_child(loc, "class", "VCDAT Top Panel").needs_to_be("visible")

    def var_panel(self):
        loc = "varmenu-main-vcdat"
        return self.main_panel().find_child(loc, "class", "VCDAT Variable Panel").needs_to_be("visible")

    def graphics_panel(self):
        loc = "graphicsmenu-main-vcdat"
        return self.main_panel().find_child(loc, "class", "VCDAT Graphics Panel").needs_to_be("visible")

    def templates_panel(self):
        loc = "templatemenu-main-vcdat"
        return self.main_panel().find_child(loc, "class", "VCDAT Templates Panel").needs_to_be("visible")

    # ---- VCDAT Top panel buttons ----
    def plot_btn(self):
        loc = "vcsmenu-plot-btn-vcdat"
        return self.top_panel().find_child(loc, "class", "Plot Button")

    def export_btn(self):
        loc = "vcsmenu-export-btn-vcdat"
        return self.top_panel().find_child(loc, "class", "Export Button")

    def clear_btn(self):
        loc = "vcsmenu-clear-btn-vcdat"
        return self.top_panel().find_child(loc, "class", "Clear Button")

    # ---- VCDAT Variable panel buttons ----
    def load_variables_file_btn(self):
        loc = "varmenu-load-variables-file-btn-vcdat"
        return self.var_panel().find_child(loc, "class", "File Load Button")

    def load_variables_path_btn(self):
        loc = "varmenu-load-variables-path-btn-vcdat"
        return self.var_panel().find_child(loc, "class", "Path Load Button")

    # Note: Locator will only show up if an existing, non-vcdat notebook is opened
    def sync_notebook_btn(self, notebook_name="sync_notebook"):
        loc = "varmenu-sync-btn-vcdat"
        return self.var_panel().find_child(loc, "class", "Sync Button")

    # ---- VCDAT Graphics panel buttons ----
    def overlay_switch(self):
        loc = "graphics-overlay-switch-vcdat"
        return self.graphics_panel().find_child(loc, "id", "Overlay Switch")

    def sidecar_switch(self):
        loc = "graphics-sidecar-switch-vcdat"
        return self.graphics_panel().find_child(loc, "id", "Sidecar Switch")

    def animate_switch(self):
        loc = "graphics-animation-switch-vcdat"
        return self.graphics_panel().find_child(loc, "id", "Animation Switch")

    def plot_type_btn(self):
        loc = "graphics-dropdown-vcdat"
        return self.graphics_panel().find_child(loc, "class", "Plot Type Dropdown")

    def colormap_btn(self):
        loc = "colormap-dropdown-vcdat"
        return self.graphics_panel().find_child(loc, "class", "Colormap Dropdown")

    # ---- VCDAT Template Panel button ----
    def template_btn(self):
        loc = "template-dropdown-vcdat"
        return self.templates_panel().find_child(loc, "class", "Template Dropdown")

    # -------------------------  SUB LEVEL LOCATORS  ---------------------------

    # Gets locator for a graphics method group in the Plot Type drop-down
    def plot_type_group(self, group):
        loc = "button.graphics-method-group-vcdat[value='{}']".format(group)
        requires = self.plot_type_btn()
        descr = "Graphic Group Option: {}".format(group)
        return self.locator(loc, "css", descr, requires).needs_to_be("visible")

    # Gets locator for a graphics method item in the Plot Type drop-down
    def plot_type_item(self, group, item):
        if self.browser == "firefox":
            # Perform steps if browser is Firefox
            self.plot_type_btn().click()
            self.plot_type_group(group).scroll_click()
        loc = "button.graphics-method-item-vcdat[value~='{}']".format(item)
        descr = "Graphic Option Item: {}".format(item)
        requires = self.plot_type_group(group)
        return self.locator(loc, "css", descr, requires).needs_to_be("visible")

    # Gets locator for 'close' button shown when selecting graphic method group
    def plot_type_close_btn(self, group="boxfill"):
        loc = "button.graphics-close-btn-vcdat"
        require = self.plot_type_group(group)
        return self.locator(loc, "css", "Graphic Group Close", require)

    # Gets the locator for the 'copy' button shown when plot type has been set
    def plot_type_copy_btn(self):
        loc = "button.graphics-copy-btn-vcdat"
        return self.locator(loc, "css", "Graphic Copy Button")

    # Gets the locator for the 'cancel' button shown when 'copy' plot is clicked
    # Will fail if plot type was not set (therefore no plot to copy from)
    def plot_type_copy_cancel_btn(self):
        loc = "button.graphics-cancel-btn-vcdat"
        requires = self.plot_type_copy_btn().needs_to_be("visible")
        return self.locator(loc, "css", "Graphic Copy Cancel Button", requires)

    # Gets locator for the name input of the plot type copy feature
    #
    def plot_type_copy_name_input(self):
        loc = "input.graphics-name-input-vcdat"
        return self.locator(loc, "css", "Graphic Copy Name Input")

    def plot_type_copy_name_enter_btn(self):
        loc = "button.graphics-enter-btn-vcdat"
        requires = self.plot_type_copy_btn().needs_to_be("visible")
        return self.locator(loc, "css", "Graphics Enter Name Button", requires)

    # Gets locator for an item in colormap drop-down
    def colormap_item(self, item):
        loc = "button.colormap-dropdown-item-vcdat[value~='{}']".format(item)
        requires = self.colormap_btn().needs_to_be("enabled")
        return self.locator(loc, "css", "Colormap Option: {}".format(item), requires).needs_to_be("visible")

    # Gets locator for an item in layout template drop-down
    def layout_template_item(self, item):
        loc = "button.template-item-vcdat[value~='{}']".format(item)
        requires = self.template_btn().needs_to_be("enabled")
        return self.locator(loc, "css", "Template Option: {}".format(item), requires)

    # ---------------------------  VCDAT Functions  ----------------------------

    # Opens a notebook and syncs it to work with vcdat
    def sync_new_notebook(self, notebook_name):
        self.create_notebook(notebook_name)
        self.sync_notebook_btn().click().sleep(3)  # Wait for imports to load


"""
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
