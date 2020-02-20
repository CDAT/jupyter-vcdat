from MainPage import MainPage

"""
PageObject for the main page of JupyterLab application
Contains locator functions for all menu items and left tabs.
"""


class AboutPage(MainPage):

    def __init__(self, driver, server=None):
        print("...Validate AboutPage...")
        super().__init__(driver, server)

    def _validate_page(self):
        print("...Validate FileBrowser...")
        # Make sure About Modal is open
        requires = self.top_menu_item("Help", "About VCDAT")
        self.locator("about-modal-vcdat", "id", "About Modal", requires)

    # ----------  TOP LEVEL LOCATORS (Always accessible on page)  --------------

    # Provides locator for an icon in the file browser
    def dismiss_button(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-modal-btn-vcdat", "class", "Dismiss Button", requires)

    def contributors_link(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-contributors-vcdat", "id", "Contributor's Link", requires)

    def documentation_link(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-documentation-vcdat", "id", "Documentation Link", requires)

    def version(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-version-vcdat", "id", "Version Text", requires).get_text()
