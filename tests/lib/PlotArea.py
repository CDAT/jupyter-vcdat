import time

from BasePage import BasePage
from BasePage import InvalidPageException

from selenium.common.exceptions import NoSuchElementException

from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.keys import Keys

class PlotArea(BasePage):

    _wait_timeout = 10
    #_delay = 3

    def __init__(self, driver, server=None):
        super(PlotArea, self).__init__(driver, server)

    def _validate_page(self):
        print("...PlotArea.validate_page()...NO OP NOW")

    def check_plot(self):
        print("...check_plot...")
        a_plot_locator = "//div[@class='p-Widget jp-RenderedImage jp-mod-trusted jp-OutputArea-output']//img[starts-with(@src, 'data:image')]"
        self.find_element(a_plot_locator, "the plot")
        time.sleep(self._delay)
