from ActionsPage import ActionsPage

"""
PageObject for the main page of JupyterLab application
Contains locator functions for all menu items and left tabs.
"""


class LoadVariablesPopup(ActionsPage):

    def __init__(self, fname, driver, server=None):
        super(LoadVariablesPopup, self).__init__(driver, server)

    def _validate_page(self):
        print("...Validate LoadVariablesPopup...")
        loc = "//div[@class='modal-header']/h5[contains(text(), 'Load Variable')]"
        self.locator(loc, "xpath", "Popup Header 'Load Variable'")
