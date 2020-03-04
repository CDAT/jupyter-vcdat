import sys
import os

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from BaseTestCase import BaseTestCase
from VcdatPanel import VcdatPanel

# To run these tests: npx task test -c test_vcdat_panel


class TestVcdatPanel(BaseTestCase):

    def test_colormap_options(self):

        vcdat_panel = VcdatPanel(self.driver, None)

        # Create notebook and sync it with vcdat
        NOTEBOOK = "test_colormap_options"
        vcdat_panel.sync_new_notebook(NOTEBOOK)

        # Select a graphics option first
        vcdat_panel.plot_type_item("boxfill", "a_boxfill").sleep(3).click()

        # Check each locator
        print("Testing colormap options...")

        # Test colormap selection (random)
        vcdat_panel.colormap_item("default").scroll_click()
        vcdat_panel.colormap_item("inferno").scroll_click()
        vcdat_panel.colormap_item("white_to_red").scroll_click()
        vcdat_panel.colormap_item("blends").scroll_click()
        vcdat_panel.colormap_item("rainbow").scroll_click()
        vcdat_panel.colormap_item("white_to_yellow").scroll_click()

        self.main_page.remove_notebook(NOTEBOOK)

    def test_graphics_options(self):

        vcdat_panel = VcdatPanel(self.driver, None)

        # Create notebook and sync it with vcdat
        NOTEBOOK = "test_graphics_options"
        vcdat_panel.sync_new_notebook(NOTEBOOK)

        # Check each locator
        print("Testing graphics options...")

        # Check graphics group options available (random)
        vcdat_panel.plot_type_group("boxfill").sleep(3).click()
        vcdat_panel.plot_type_group("scatter").click()
        vcdat_panel.plot_type_group("xvsy").click()
        vcdat_panel.plot_type_group("1d").click()
        vcdat_panel.plot_type_group("3d_dual_scalar").click()
        vcdat_panel.plot_type_group("3d_vector").click()

        # Test close button
        vcdat_panel.plot_type_group("isoline").click()
        vcdat_panel.plot_type_close_btn().click()

        # Check graphics methods (random)
        vcdat_panel.plot_type_item("boxfill", "robinson").click()
        vcdat_panel.plot_type_item("scatter", "default_scatter_").click()
        vcdat_panel.plot_type_item("xvsy", "default").click()
        vcdat_panel.plot_type_item(
            "3d_scalar", "Hovmoller3D").scroll_click().sleep(3)

        vcdat_panel.plot_type_item("xvsy", "a_1d").click()

        # Try Copy/Cancel of graphic method
        vcdat_panel.plot_type_copy_btn().click().sleep(2)
        vcdat_panel.plot_type_copy_cancel_btn().click()

        # Try copy and enter new name
        vcdat_panel.plot_type_copy_btn().click()
        vcdat_panel.plot_type_copy_name_input().enter_text("This should be invalid")

        # Test invalid name
        if vcdat_panel.plot_type_copy_name_enter_btn().get_text() != "Invalid!":
            assert("The text should say 'Invalid!'")
        else:
            print("Button was correctly displaying 'Invalid!'...")
        if vcdat_panel.plot_type_copy_name_enter_btn().enabled():
            assert("The 'copy enter' button should be disabled.")
        else:
            print("Button was correctly disabled...")

        # Test valid name
        vcdat_panel.plot_type_copy_name_input().enter_text("this_should_be_valid")
        if vcdat_panel.plot_type_copy_name_enter_btn().get_text() == "Enter":
            print("Button corretly became 'Enter' and enabled...")
            vcdat_panel.plot_type_copy_name_enter_btn()
        else:
            assert("The text should say 'Enter'.")

        self.main_page.remove_notebook(NOTEBOOK)

    def test_top_level(self):

        vcdat_panel = VcdatPanel(self.driver, None)

        # Open VCDAT panel
        self.main_page.open_left_tab("VCDAT")

        # Check each locator
        print("Testing top level locators in VCDAT Panel...")
        vcdat_panel.plot_btn().found()
        vcdat_panel.export_btn().found()
        vcdat_panel.clear_btn().found()
        vcdat_panel.load_variables_file_btn().found()
        vcdat_panel.load_variables_path_btn().found()
        vcdat_panel.overlay_switch().click()
        vcdat_panel.sidecar_switch().click()
        vcdat_panel.animate_switch().click()
        vcdat_panel.plot_type_btn().found()
        vcdat_panel.colormap_btn().found()
        vcdat_panel.template_btn().found()

    def test_template_options(self):

        vcdat_panel = VcdatPanel(self.driver, None)

        # Create notebook and sync it with vcdat
        NOTEBOOK = "test_template_options"
        vcdat_panel.sync_new_notebook(NOTEBOOK)

        # Check each locator
        print("Testing template options...")

        # Test layout template options
        vcdat_panel.layout_template_item("ASD").sleep(3).scroll_click()
        vcdat_panel.layout_template_item("LLof4").scroll_click()
        vcdat_panel.layout_template_item("default").scroll_click()
        vcdat_panel.layout_template_item("top_of2").scroll_click()
        vcdat_panel.layout_template_item("polar").scroll_click()
        vcdat_panel.layout_template_item("no_legend").scroll_click()
        vcdat_panel.layout_template_item("quick").scroll_click()

        self.main_page.remove_notebook(NOTEBOOK)
