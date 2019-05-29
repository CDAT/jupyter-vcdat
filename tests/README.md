# Python Selenium test suite for jupyter-vcdat

## Test suite structure 

The test suite is organized as follows:
- tests/PageObjects/*py implement classes that encapsulate locators which are means to find the selenium elements in the html page.
- tests/TestUtils/*py implement BaseTestCase and BaseTestCaseWithNoteBook classes. Test cases should inherit BaseTestCaseWithNoteBook class which will create a new note book and name it uniquely before starting test steps, and clean up after finishing test steps.
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

- When implementing a method to click on an element, please implement a locate() method and a click() method. For example in **VcdatPanel** class, we have:
  - locate_export_plot() which implements how do find the 'Export Plot' button.
  - click_on_export_plot() which calls locate_export_plot() and click on the element returned.
This ensures the locator for 'Export Plot' button is only defined in one place in the test suite.

All of the classes under tests/PageObjects implement action methods on the corresponding pages. Test cases may instantiate some of these classes and call methods to perform actions on the page.

## Common methods for test cases

Please examine the available classes and methods before adding test cases.
```bash
   ## Actions class
   find_element_by_id(id, descr)
   find_elements_by_id(id, descr)
   find_element_by_class(class_name, descr)
   find_elements_by_class(class_name, descr)
   find_element_by_xpath(xpath,descr)
   find_elements_by_xpath(xpath, descr)
   find_element_by_css(css, descr)
   find_elements_by_css(css, descr)
   move_to_click(element)
   move_to_double_click(element)
   scroll_into_view(element)
   scroll_click(element)
   wait_click(method, locator)
   enter_text(input_area, text)
   open_file_browser()
   open_vcdat_widget()
   wait_till_element_is_visible()
   wait_till_element_is_clickable()

   ## VcdatPanel class
   locate_plot()
   locate_export_plot()
   locate_clear()
   locate_load_variables()
   locate_select_plot_type()
   locate_select_a_template()
   click_on_plot()
   click_on_export_plot()   
   click_on_clear()
   click_on_load_variables()
   click_on_select_plot_type()
   click_on_select_a_template()
   select_a_plot_type(plot_type)
   select_a_template(template)
   
   ## LoadVariablesPopUp class
   locate_variable(var)
   click_on_variable(var)
   locate_variable_axis(var)
   click_on_variable_axes(var)
   click_on_load()
   locate_axis_with_title(var, axis_title)
   adjust_var_axes_slider(var, axis_title, min_offset_percent, max_offset_percent)
   locate_all_axes_for_variable(var)

   ## SavePlotPopUp class
   input_plot_file_name(plot_name)
   select_export_format(export_format)
   click_on_export()
   select_custom_dimensions()
   deselect_custom_dimensions()
   click_on_custom_dimensions_unit()
   enter_unit_width(the_dimension)
   enter_unit_height(the_dimension)
   select_capture_provenance()
   deselect_capture_provenance()
   select_overlay_mode()
   deselect_overlay_mode()
   select_variable(var)
   deselect_variable(var)
   click_on_edit_button_for_variable(var)

   ## EditAxisPopUp class
   adjust_var_axes_slider(var, axis_title, min_offset_percent, max_offset_percent)
   click_on_update()

   ## FileBrowser class
   double_click_on_a_file()

   ## NoteBookPage class
   new_notebook(launcher_title, notebook_name)
   get_notebook_name()
   rename_notebook(new_name)
   save_current_notebook()
   close_current_notebook()
```
  
## Preparation to run test cases

- Follow instructions to install jupyter-vcdat.
- Do the following steps to install packages needed to run python selenium test cases:
```bash
    cd <jupyter-vcdat repo directory>
    source jupyter-vcdat
    conda install -c cdat/label/v81 testsrunner cdat_info
    pip install selenium
    pip install pyvirtualdisplay
```

- To run tests with **chrome**, open a terminal window, and do:
```bash
    # Download 'chromedriver' from the site listed at
    # https://selenium-python.readthedocs.io/installation.html
    # Note down the location of 'chromedriver' and set the value of
    # BROWSER_DRIVER accordingly.

    # set the following environment variables:
    export BROWSER_DRIVER=/usr/local/bin/chromedriver
    export BROWSER_MODE="--foreground"
    export BROWSER_TYPE=chrome
```

- To run tests with **firefox**, open a terminal window, and do:
```bash
    # Download 'geckodriver' from the site listed at
    # https://selenium-python.readthedocs.io/installation.html
    # Note down the location of 'geckodriver'

    # set the following environment variables:
    export BROWSER_BINARY=/Applications/Firefox.app/Contents/MacOS/firefox  # EDIT_THIS
    export BROWSER_DRIVER=$HOME/work/selenium/geckodriver  # EDIT_THIS
    export BROWSER_MODE="--foreground"
    export BROWSER_TYPE=firefox
```

## Run test cases
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

## Run tests in Circle CI

When adding a new test file, validate that the new test cases run fine locally with chrome and firefox, and then add the new test cases to .circleci/config.yml.

