from ActionsPage import ActionsPage

"""
PageObject for the main page of JupyterLab application
Contains locator functions for all menu items and left tabs.
"""


class DimensionSlider(ActionsPage):

    def __init__(self, container, name, driver, server=None):
        super(DimensionSlider, self).__init__(driver, server)
        self.container = container
        self.name = name

    def dimension_slider(self, name, axis):
        loc = "{} div.dimension-slider-vcdat[data-axisname~='{}']".format(
            name, axis)
        return self.locator(loc, "css", "Variable '{}' Dimension Slider for axis: {}".format(name, axis))
