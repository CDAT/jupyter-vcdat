import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from BaseTestCase import BaseTestCase
from LoadVariablePopUp import LoadVariablePopUp
from Canvas import Canvas

import unittest


class TestLoadVariable(BaseTestCase):

    def test_plot_variable_1(self):
        '''
        load 'clt.nc', load 'clt' variable, load and plot.
        '''
        print("\n\n...test_plot_variable_1...")
        print("xxx xxx xxx {t}".format(t=self._testMethodName))

        self.load_data_file("clt.nc")

        load_variable_pop_up = LoadVariablePopUp(self.driver)
        load_variable_pop_up.click_on_var('clt')

        load_variable_pop_up.load()

        self.click_on_plot()

        canvas = Canvas(self.driver)
        canvas.check_plot()

        self.click_on_clear()

    def test_plot_variable_2(self):
        '''
        load 'clt.nc', load 'u' variable, load 'v' variable, load and plot.
        '''
        print("\n\n...test_plot_variable_2...")

        self.load_data_file("clt.nc")

        load_variable_pop_up = LoadVariablePopUp(self.driver)
        load_variable_pop_up.click_on_var('u')
        load_variable_pop_up.click_on_var('v')
        load_variable_pop_up.load()

        self.click_on_plot()

        canvas = Canvas(self.driver)
        canvas.check_plot()


if __name__ == '__main__':
    unittest.main(verbosity=2)

# nosetests -s tests/test_variable.py:TestLoadVariable.test_plot_variable_1
