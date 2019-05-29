# Python Selenium test suite for jupyter-vcdat

## Test suite structure 

The test suite is organized as follows:
- tests/PageObjects/*py implement classes that encapsulate locators which are means to find the selenium elements in the html page.
- tests/TestUtils/*py implement BaseTestCase and BaseTestCaseWithNoteBook classes. Test cases should inherit one of these classes.
- tests/*py implements the test cases. 


## Guidelines

- Python Selenium locators (XPath, class names, id of selenium elements) should not be in any of the tests/test*py files. Locators should be encapsulated in a class in one of tests/PageObjects/*py.
- Under tests/PageObjects, there are following classes:
  - **Actions** class is a base class implementing actions like: find_element_by_id(), find_element_by_xpath() etc.
  - **ActionsPage** class is a subclass of **Actions** class which should be the parent class of all 'page' classes.
  - **MainPage** class is a page class for the main page of jupyter-vcdat web app.
  - **NoteBookPage** class is a page class for the notebook page.
  - **LoadVariablesPopUp** class is a page class for the 'Load Variables' pop up page.
  - **EditAxisPopUp** class is a page class for the 'Edit Axis' pop up page.
  - **SavePlotPopUp** class is a page class for the 'Save Plot' pop up page.
  - **VcdatPanel** class is a page class for the vcdat panel that is on the left side of the web app.
  - **FileBrowser** class is a page class for the File Browser/

All of the classes under tests/PageObjects implement action methods on the corresponding pages. Test cases may instantiate some of these classes and call methods to perform actions on the page. None of files under test/*py should specify a locator (xpath, id, class name, css) of an element. Each element locator should only be specified in one place under tests/PageObjects/*py.
  
## Preparation to run testcases

- Follow instructions to install jupyter-vcdat.
- Do the following steps to install packages needed to run python selenium test cases:
```bash
    cd <jupyter-vcdat repo directory>
    source jupyter-vcdat
    conda install -c cdat/label/v81 testsrunner cdat_info
    pip install selenium
    pip install pyvirtualdisplay
```

- To run tests with 'chrome', open a terminal window, and do the following:
```bash
    # download 'chromedriver' from the site listed at
    # https://selenium-python.readthedocs.io/installation.html
    # note down the location of 'chromedriver' and set the value of
    # BROWSER_DRIVER accordingly.

    # set the following environment variables:
    export BROWSER_DRIVER=/usr/local/bin/chromedriver
    export BROWSER_MODE="--foreground"
    export BROWSER_TYPE=chrome
```

- To run tests with 'firefox', open a terminal window, and do the following:
```bash
    # download 'geckodriver' from the site listed at
    # https://selenium-python.readthedocs.io/installation.html
    # note down the location of 'geckodriver'

    # set the following environment variables:
    export BROWSER_BINARY=/Applications/Firefox.app/Contents/MacOS/firefox  # EDIT_THIS
    export BROWSER_DRIVER=$HOME/work/selenium/geckodriver  # EDIT_THIS
    export BROWSER_MODE="--foreground"
    export BROWSER_TYPE=firefox
```

##Run test cases
```bash
    # cd to the jupyter-vcdat repo directory
    source activate jupyter-vcdat
    python run_tests.py -H -v 2 tests/test_locators.py
    python run_tests.py -H -v 2 tests/test_load_a_variable.py
    python run_tests.py -H -v 2 tests/test_load_variables_popup_locators.py
    python run_tests.py -H -v 2 tests/test_plot_locators.py
    python run_tests.py -H -v 2 tests/test_edit_axis_locators.py
```

- Examples on how to run individual test cases
```bash
    nosetests -s tests/test_plot_locators.py:TestPlot.test_plot
    nosetests -s tests/test_plot_locators.py:TestPlot.test_select_plot_type
    nosetests -s tests/test_plot_locators.py:TestPlot.test_select_a_template
    nosetests -s tests/test_plot_locators.py:TestPlot.test_export_plot
    nosetests -s tests/test_plot_locators.py:TestPlot.test_export_plot_adjust_unit
    ...
```

##Run tests in Circle CI

When adding a new test file, validate that the new test cases run fine locally with chrome and firefox, and then add the new test cases to .circleci/config.yml.

