import os
import sys

this_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(this_dir, '..', 'PageObjects'))

from BaseTestCase import BaseTestCase


class BaseTestCaseWithNoteBook(BaseTestCase):

    def setUp(self):
        super(BaseTestCaseWithNoteBook, self).setUp()
        notebook_name = "{}.ipynb".format(self._testMethodName)
        launcher = "Python [conda env:jupyter-vcdat] *"
        notebook = self.new_notebook(launcher, notebook_name)
        self.notebooks = []
        self.notebooks.append(notebook)
        self.create_workdir()
        print("\n")

    def tearDown(self):
        for nb in self.notebooks:
            self.save_close_notebook(nb)
        self.main_page.shutdown_all_kernels()
        self.driver.quit()

        for nb in self.notebooks:
            nb_name = nb.get_notebook_name()
            print("...deleting '{}' notebook".format(nb_name))
            os.remove(nb_name)

    def create_workdir(self):
        this_dir = os.path.abspath(os.path.dirname(__file__))
        self.workdir = os.path.join(this_dir, "../..", "tests_workdir")
        if os.path.exists(self.workdir) is False:
            os.mkdir(self.workdir)

    def validate_file_exists(self, filename):
        print("xxx xxx validate_file_exists: {}".format(filename))
        assert os.path.isfile(filename)
