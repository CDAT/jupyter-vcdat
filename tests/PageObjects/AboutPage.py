from Locator import Locator
from MainPage import MainPage
from typing import Any, Callable, List, Optional, Union

"""
PageObject for the main page of JupyterLab application
Contains locator functions for all menu items and left tabs.
"""


class AboutPage(MainPage):
    def __init__(self, driver: object, server: Optional[object] = None) -> None:
        print("...Validate AboutPage...")
        super().__init__(driver, server)

    def _validate_page(self) -> None:
        print("...Validate FileBrowser...")
        # Make sure About Modal is available
        requires = self.top_menu_item("Help", "About VCDAT")
        self.locator("about-modal-header-vcdat", "class",
                            "About Modal Header", requires).found()

    # ----------  TOP LEVEL LOCATORS (Always accessible on page)  --------------
    def about_header(self) -> Locator:
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-modal-header-vcdat", "class",
                            "About Modal Header", requires)
    
    def about_body(self) -> Locator:
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-modal-body-vcdat", "class",
                            "About Modal Body", requires)
    
    def about_footer(self) -> Locator:
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator("about-modal-footer-vcdat", "class",
                            "About Footer", requires)

    def version(self) -> Locator:
        #self.about_page().find_child("about-version-vcdat", "id", "Version Text").get_text()

        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator(
            "about-version-vcdat", "class", "Version Text", requires
        ).get_text()

    def contributors_link(self) -> Locator:
        #return self.about_page().find_child("about-contributors-vcdat", "id", "Contributor's Link")
        
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator(
            "about-contributors-vcdat", "class", "Contributor's Link", requires
        )

    def documentation_link(self) -> Locator:
        #return self.about_page().find_child("about-documentation-vcdat", "id", "Documentation Link")

        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator(
            "about-documentation-vcdat", "class", "Documentation Link", requires
        )

    def dismiss_button(self) -> Locator:
        #return self.about_page().find_child("about-modal-btn-vcdat", "class", "Dismiss Button")
        
        requires = self.top_menu_item("Help", "About VCDAT")
        return self.locator(
            "about-modal-btn-vcdat", "class", "Dismiss Button", requires
        )

