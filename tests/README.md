# Python Selenium test suite for jupyter-vcdat

## Test suite structure

The test suite is organized as follows:

- tests/\*py implements the test cases.
- tests/PageObjects/\*py implement classes that encapsulate locators which are means to interact with elements in the html page.
- tests/TestUtils/\*py implement BaseTestCase and BaseTestCaseWithNoteBook classes. Test cases should inherit BaseTestCase
which will perform setup steps and and clean up after finishing test steps.

## Guidelines

- Python Selenium locators (XPath, class names, id of selenium elements) should not be in any of the tests/test*py files. Locators should be encapsulated in a class in one of tests/PageObjects/*py.
- Under tests/PageObjects, there are following classes:

  - **Actions** class is a base class implementing actions like: find_element(), and find_elements() etc. As well as the 'Action' object.
  - **ActionsPage** class is a subclass of **Actions** class which should be the parent class of all 'page' classes.
  - **Locator** class handles interactions between 'Actions' class and page elements, to provide functionality to PageObject classes.
  - **MainPage** class is a page class for the main page of jupyter-vcdat web app.
  - **VcdatPanel** class is a page class for the vcdat panel that is on the left side of the web app.
  - **FileBrowser** class is a page class for the File Browser.
  <!--
  - **NoteBookPage** class is a page class for the notebook page.
  - **LoadVariablesPopUp** class is a page class for the 'Load Variables' pop up page.
  - **EditAxisPopUp** class is a page class for the 'Edit Axis' pop up page.
  - **SavePlotPopUp** class is a page class for the 'Save Plot' pop up page.
  -->
  - **AboutPage** class is for the About dialog which opens when the 'About VCDAT' is clicked in the 'help' menu.

- When implementing a new interaction with the UI, the goal should be to create a function which returns a 'locator' object. For example in **MainPage** class, we have:
  - jupyter_icon() which returns a locator object using the 'locator' create function inherited from ActionsPage.
- Creating a locator requires:
    - locator: can be an xpath, css, etc. used to find the element on the page
    - locator type: specifies what method to use to find the element (xpath, css, id etc.)
    - description: will be used to describe the element during testing and logging of test results. 
    - requirements: any additional arguments after description are interpreted as locators or actions that need to be satisfied before the current element can be accessed. These can be either locator or action objects only. Note: the requirements are only performed if the element is not found with the first attempt.
    - If the locator depends on previous locators being clicked, just pass the required locator object as a requirement and it will be clicked if needed. For example, in the **MainPage** class:
        - top_menu_item() returns a locator which requires a 'top_menu' parent locator to be open first. If the parent locator is closed, the current locator would fail to be accessed, which would trigger the parent to be clicked, and then the current locator can be accessed.
    - If the locator depends on a specific function to be run in order to be accessed, you can pass an action object as a requirement (described below).
- Creating an 'Action' object which can be required by locators:
    - function: the function that needs to be run, without parameters or ()
    - description: used to describe the action during testing and logging test results.
    - arguments (optional): any additional arguments will be passed as arguments to the action function when it's run.
    - As an example, see **MainPage** tutorial_next() function, which creates an action object and passes it as a requirement to the locator.
- Once created, locator objects come with built-in functions which are used by tests to interact with the U.I.
    - Note: action 'objects' described above are created to specify a locator requirement and are meant to be used in page objects, not in tests.
    - Action functions can be chained for example:
        - 'input_locator.click().enter_text("input to enter").sleep(3).press_enter()' will first click the input_locator element, then enter text 'input to enter', then sleep for 3 seconds, then press the 'Enter' key.
    - Locator object can be created once, and used multiple times for different actions, for example:
        - my_locator.click(), my_locator.enter_text("text"), my_locator.double_click(), etc. 

All of the classes under tests/PageObjects implement action methods on the corresponding pages. Test cases may instantiate some of these classes and call methods to perform actions on the page.

## Common methods for test cases

Please examine the available classes and methods before adding test cases.

```bash
   ## ActionsPage class
   locator(locator_string, locator_type, description, requirements) # Creates a locator object
   action(function, description, arguments) # Creates an action object

   ## Locator object functions (available from created locators)
   click() # Clicks the locator element
   double_click() # Double clicks locator element
   enter_text(text) # Enters specified text, in locator element
   get_value(variable) # Looks for the 'value' attribute in element and saves the value in the specified variable
   press_enter() # Presses the 'Enter' key event for the locator element
   scroll_click() # Scrolls the element into view and clicks it
   scroll_view # Scrolls the element into view

   ## MainPage available locators:
   jupyter_icon()
   vcdat_icon()
   top_menu(name)
   top_menu_item(parent, name)
   

```

## Preparation to run test cases

- Follow instructions to install jupyter-vcdat.
- Do the following steps to install packages needed to run python selenium test cases:

```bash
    cd <jupyter-vcdat repo directory>
    source activate jupyter-vcdat
    conda install -c cdat/label/v81 testsrunner cdat_info
    pip install selenium
    pip install pyvirtualdisplay
```

- To run tests with **chrome**, open a terminal window, and do:

```bash
    # Download 'chromedriver' from the site listed at
    # https://sites.google.com/a/chromium.org/chromedriver/downloads
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
    # https://github.com/mozilla/geckodriver/releases
    # Note down the location of 'geckodriver'

    # set the following environment variables:
    export BROWSER_BINARY=/Applications/Firefox.app/Contents/MacOS/firefox  # EDIT_THIS
    export BROWSER_DRIVER=$HOME/work/selenium/geckodriver  # EDIT_THIS
    export BROWSER_MODE="--foreground"
    export BROWSER_TYPE=firefox
```

## Start Jupyter Lab before running test cases

```bash
    # cd to the jupyter-vcdat repo directory
    jupyter lab
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
    python run_tests.py -H -v 2 tests/test_file_browser_locators.py
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
