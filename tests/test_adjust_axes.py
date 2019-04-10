import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from BaseTestCase import BaseTestCase
from LoadVariablePopUp import LoadVariablePopUp
from Canvas import Canvas

import unittest


class TestAdjustAxes(BaseTestCase):

    def test_adjust_axes_1(self):
        '''
        load 'clt.nc', load 'u' variable, adjust slider, load, and plot.
        '''
        print("\n\n...test_adjust_axes_1...")

        left_side_bar = self.load_data_file("clt.nc")

        load_variable_pop_up = LoadVariablePopUp(self.driver)
        load_variable_pop_up.click_on_var('u')
        load_variable_pop_up.click_on_var_axes('u')

        # adjust the min slider by 20 percent and max slider by 20 percent.
        load_variable_pop_up.adjust_var_axes_slider('u', 'latitude1', 20, -20)
        load_variable_pop_up.load()
        left_side_bar.click_on_plot()
        canvas = Canvas(self.driver)
        canvas.check_plot()

    def test_adjust_axes_2(self):
        '''
        load 'clt.nc', load 'u' variable, load 'v' variable, adjust sliders, load, and plot.
        '''
        print("\n\n...test_adjust_axes_2...")

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
        canvas = Canvas(self.driver)
        canvas.check_plot()


if __name__ == '__main__':
    unittest.main(verbosity=2)

# nosetests -s tests/test_adjust_axes.py:TestAdjustAxes.test_adjust_axes_2
