import time

from BasePage import BasePage


class PlotArea(BasePage):

    def __init__(self, driver, server=None):
        super(PlotArea, self).__init__(driver, server)

    def _validate_page(self):
        print("...PlotArea.validate_page()...NO OP NOW")

    def check_plot(self):

        print("...check_plot...")
        a_plot_locator = "//img[starts-with(@src, 'data:image')]"
        self.find_element(a_plot_locator, "the plot")
        time.sleep(self._delay)
