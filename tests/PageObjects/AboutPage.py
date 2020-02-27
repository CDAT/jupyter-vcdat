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
        # Make sure About Modal is available
        requires = self.top_menu_item("Help", "About VCDAT")
        self.locator("about-modal-header-vcdat", "class",
                     "About Modal Header", requires).found()

    # ----------  TOP LEVEL LOCATORS (Always accessible on page)  --------------
    def about_header(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-modal-header-vcdat", "class",
                            "About Modal Header", requires)

    def about_body(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-modal-body-vcdat", "class",
                            "About Modal Body", requires)

    def about_footer(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-modal-footer-vcdat", "class",
                            "About Footer", requires)

    def version(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator(
            "about-version-vcdat", "class", "Version Text", requires
        ).get_text()

    def contributors_link(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator(
            "about-contributors-vcdat", "class", "Contributor's Link", requires
        )

    def documentation_link(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator(
            "about-documentation-vcdat", "class", "Documentation Link", requires
        )

    def dismiss_button(self):
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator(
            "about-modal-btn-vcdat", "class", "Dismiss Button", requires
        )
