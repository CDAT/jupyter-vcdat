import os
import sys
import time

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, 'TestUtils'))
sys.path.append(os.path.join(this_dir, 'PageObjects'))

from BaseTestCase import BaseTestCase
from LoadVariablePopUp import LoadVariablePopUp
from Canvas import Canvas

import unittest


class TestLargeData(BaseTestCase):

    def test_plot_large_data_1(self):
        print("\n\n...test_plot_large_data_1...")
        self.download_sample_data()

        # REVISIT -- needs a way to check that download is completed before proceeding
        time.sleep(20)
        self.load_sample_data("sample_data/tas_6h.nc")

        load_variable_pop_up = LoadVariablePopUp(self.driver)
        load_variable_pop_up.click_on_var('tas')
        load_variable_pop_up.load()

        time.sleep(5)

        self.click_on_plot()

        canvas = Canvas(self.driver)
        canvas.check_plot()


if __name__ == '__main__':
    unittest.main(verbosity=2)

# nosetests -s tests/test_large_data.py:TestLargeData.test_plot_large_data_1
