from ActionsPage import ActionsPage

"""
PageObject for the main page of JupyterLab application
Contains locator functions for all menu items and left tabs.
"""


class LoadVariablesPopUp(ActionsPage):
    def __init__(self, driver, server=None):
        super(LoadVariablesPopUp, self).__init__(driver, server)

    def _validate_page(self):
        print("...Validate LoadVariablesPopup...")
        loc = "//div[@class='modal-header']/h5[contains(text(), 'Load Variable')]"
        return self.locator(loc, "xpath", "Popup Header 'Load Variable'")

    # ----------  TOP LEVEL LOCATORS (Always accessible on page)  --------------
    def variable_btn(self, name):
        varcard = "div.card-body[data-name='{}']".format(name)
        loc = "{} button.varcard-name-btn-vcdat".format(varcard)
        return self.locator(loc, "css", "Variable '{}' Button".format(name))

    def search_variable_input(self):
        loc = "input.var-loader-search-input-vcdat"
        return self.locator(loc, "css", "Search Variable Input")

    def load_button(self):
        loc = "button.var-loader-load-btn-vcdat"
        return self.locator(loc, "css", "Load Button")

    # -------------------------  SUB LEVEL LOCATORS  ---------------------------

    # This button is visible next to a selected variable only
    def edit_variable_btn(self, name):
        varcard = "div.card-body[data-name='{}']".format(name)
        loc = "{} button.varcard-axes-btn-vcdat".format(varcard)
        requires = self.variable_btn(name)
        return self.locator(loc, "css", "Variable '{}' Edit Button".format(name))

    def rename_variable_input(self, name):
        varcard = "div.card-body[data-name='{}']".format(name)
        loc = "{} input.varcard-rename-input-vcdat".format(varcard)
        requires = self.edit_variable_btn(name)
        return self.locator(loc, "css", "Variable '{}' Rename Input".format(name))

    def rename_variable_status(self, name):
        varcard = "div.card-body[data-name='{}']".format(name)
        loc = "{} button.varcard-rename-status-vcdat".format(varcard)
        requires = self.edit_variable_btn(name)
        return self.locator(loc, "css", "Variable '{}' Rename Status".format(name))

    def dimension_slider(self, name):
        varcard = "div.card-body[data-name='{}']".format(name)
        return DimensionSlider(self.driver, self.server, varcard, name)
