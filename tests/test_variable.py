import unittest
import os 
import sys
import time

this_dir = os.path.abspath(os.path.dirname(__file__))
lib_dir = os.path.join(this_dir, 'lib')
sys.path.append(lib_dir)

from BaseTestCase import BaseTestCase
from BasePage import InvalidPageException
from VcdatLeftSideBar import VcdatLeftSideBar
from FileBrowser import FileBrowser
from MainPage import MainPage
from NoteBookPage import NoteBookPage
from JupyterUtils import JupyterUtils
from LoadVariablePopUp import LoadVariablePopUp
from PlotArea import PlotArea
from selenium.common.exceptions import NoSuchElementException


class BrowserTest(BaseTestCase):

    @classmethod
    def setup_class(self):
        print("...setup_class...")
        utils = JupyterUtils()
        self.server = utils.get_server()        


    def test_plot_variable_1(self):
        '''
        load 'clt.nc', load 'clt' variable, load and plot.
        '''
        print("\n\n...test_plot_variable_1...")

        main_page = MainPage(self.driver, self.server)
        self.close_notebook_if_any()

        left_side_bar = self.load_data_file("clt.nc")

        load_variable_pop_up = LoadVariablePopUp(self.driver)
        load_variable_pop_up.click_on_var('clt')
        load_variable_pop_up.load()

        left_side_bar.click_on_plot()

        plot_area = PlotArea(self.driver)
        plot_area.check_plot()
        main_page.shutdown_kernel()
        self.close_notebook_if_any()

    def ABCtest_plot_variable_2(self):
        '''
        load 'clt.nc', load 'u' variable, load 'v' variable, load and plot.
        '''
        print("\n\n...test_plot_variable_2...")

        server = self.server
        main_page = MainPage(self.driver, self.server)
        self.close_notebook_if_any()

        left_side_bar = self.load_data_file("clt.nc")

        load_variable_pop_up = LoadVariablePopUp(self.driver)
        load_variable_pop_up.click_on_var('u')
        load_variable_pop_up.click_on_var('v')
        load_variable_pop_up.load()

        left_side_bar.click_on_plot()

        plot_area = PlotArea(self.driver)
        plot_area.check_plot()
        self.close_notebook_if_any()

    def ABCtest_plot_variable_3(self):
        '''
        load 'clt.nc', load 'u' variable, adjust slider, load, and plot.
        '''
        print("\n\n...test_plot_variable_3...")

        server = self.server
        main_page = MainPage(self.driver, self.server)
        self.close_notebook_if_any()

        left_side_bar = self.load_data_file("clt.nc")

        load_variable_pop_up = LoadVariablePopUp(self.driver)
        load_variable_pop_up.click_on_var('u')
        load_variable_pop_up.click_on_var_axes('u')
        # adjust the min slider by 20 percent and max slider by 20 percent.
        load_variable_pop_up.adjust_var_axes_slider('u', 'latitude1', 20, -20)

        load_variable_pop_up.load()
        left_side_bar.click_on_plot()
        plot_area = PlotArea(self.driver)
        plot_area.check_plot()
        self.close_notebook_if_any()

    def ABCtest_plot_variable_4(self):
        '''
        load 'clt.nc', load 'u' variable, load 'v' variable, adjust sliders, load, and plot.
        '''
        print("\n\n...test_plot_variable_4...")

        server = self.server
        main_page = MainPage(self.driver, self.server)
        self.close_notebook_if_any()

        left_side_bar = self.load_data_file("clt.nc")

        load_variable_pop_up = LoadVariablePopUp(self.driver)
        load_variable_pop_up.click_on_var('u')
        load_variable_pop_up.click_on_var_axes('u')
        # adjust the min slider by 20 percent and max slider by 20 percent.
        load_variable_pop_up.adjust_var_axes_slider('u', 'longitude1', 20, -20)

        load_variable_pop_up.click_on_var('v')
        load_variable_pop_up.click_on_var_axes('v')
        # adjust the min slider by 20 percent and max slider by 20 percent.
        load_variable_pop_up.adjust_var_axes_slider('v', 'longitude2', 20, -20)

        load_variable_pop_up.load()
        left_side_bar.select_plot_type("streamline (default)")

        left_side_bar.click_on_plot()
        plot_area = PlotArea(self.driver)
        plot_area.check_plot()
        main_page.shutdown_kernel()
        self.close_notebook_if_any()

if __name__ == '__main__':
    unittest.main(verbosity=2)


# nosetests -s tests/test_variable.py:BrowserTest.test_plot_variable_4
