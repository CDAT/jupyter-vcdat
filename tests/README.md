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

  - *Page Object Dependency Classes*
    - **Actions** class is a base class implementing actions like: find_element(), and find_elements() etc. As well as the 'Action' object.
    - **ActionsPage** class is a subclass of **Actions** class which should be the parent class of all 'page' classes.
    - **Locator** class handles interactions between 'Actions' class and page elements, to provide functionality to PageObject classes.
    - **Utils** a class containing test specific utility functions used for tests.
    - **JupyterUtils** a Jupyter utility class containing a few functions for use by objects pages if needed.

  - *Page Object Classes*
    - **AboutPage** class is for the About dialog which opens when the 'About VCDAT' is clicked in the 'help' menu.
    - **DimensionSlider** class that is for controlling the
    dimension slider of the variable edit/load popups.
    - **FileBrowser** class is a page class for the File Browser.
    - **LoadVariablesPopUp** class is a page class for the 'Load Variables' pop up page.
    - **MainPage** class is a page class for the main page of jupyter-vcdat web app.
    - **VcdatPanel** class is a page class for the vcdat panel that is on the left side of the web app.
    
  <!-- PageObjects yet to be implemented in new format
  - **Canvas** class for the vcs canvas plot tests
  - **EditAxis** class is a page class for the 'Edit Axis'.
  - **EditAxisPopUp** class is a page class for the 'Edit Axis' pop up page.
  - **NoteBookPage** class is a page class for the notebook page.
  - **SavePlotPopUp** class is a page class for the 'Save Plot' pop up page.
  -->

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
    - As an example, see **VcdatPanel** main_panel() function, which creates an action object and passes it as a requirement to the locator to ensure the left tab is opened if the main panel was not found.
- Once created, locator objects come with built-in functions which are used by tests to interact with the U.I.
    - Note: action 'objects' described above are created to specify a locator requirement and are meant to be used in page objects, not in tests.
    - Action functions can be chained for example:
        - 'input_locator.click().enter_text("input to enter").sleep(3).press_enter()' will first click the input_locator element, then enter text 'input to enter', then sleep for 3 seconds, then press the 'Enter' key.
    - Locator object can be created once, and used multiple times for different actions, for example:
        - my_locator.click(), my_locator.enter_text("text"), my_locator.double_click(), etc. 

All of the classes under tests/PageObjects implement action methods on the corresponding pages. Test cases may instantiate some of these classes and call methods to perform actions on the page.

## Common methods for test cases

Please examine the available classes and methods before adding test cases.

## Preparation to run test cases

- Follow instructions to install jupyter-vcdat.
- Do the following steps to install packages needed to run python selenium test cases:

- For tests in **chrome**:

    - Download 'chromedriver' from the site listed at:
    https://sites.google.com/a/chromium.org/chromedriver/downloads
    - Note down the location of 'chromedriver', it will be
    needed for configuring tests

- To run tests with **firefox**:

    - Download 'geckodriver' from the site listed at
    https://github.com/mozilla/geckodriver/releases
    - Note down the location of 'geckodriver'
    - Note the location of the firefox application.
    (In MacOS, path is usually at: '/Applications/Firefox.app/Contents/MacOS/firefox')

- Run the test tools installer script:
```bash
    cd npx task installTestTools
```
- Enter information where prompted (as noted down previously)

## Start Jupyter Lab before running test cases

```bash
    # cd to the jupyter-vcdat repo directory
    jupyter lab
```

## Run test cases

```bash
    # cd to the jupyter-vcdat repo directory
    source activate jupyter-vcdat
    npx task test # Use --help for test options and examples
```

- Examples on how to run individual test cases

```bash
    # Test using Chrome
    npx task test -c test_main_page
    # Test using Firefox
    npx task test -f test_main_page
    # Test in both
    npx task test test_main_page
```

## Adding new test files

- Create a new test file and place within the 'tests' folder.

- You will then need to update the TESTS dictionary located near the top of **'tasksfile.ts'**.
This will ensure your new test is counted as a test option and can then be run individually using:

  ```bash
  npx task test <your_new_test>
  ```

- Add test to the dictionary in this format:
  ```javascript
  TEST_FILE: [
    "TEST_CLASS",
    "test_1",
    "test_2",
    "test_3"
    ]
  ```
- Note:
  *ALL NAMES MUST BE UNIQUE FROM OTHER TESTS TO AVOID CONFLICTS*
  
  TEST_FILE is the name of your Python test file, with the extension removed, e.g. test_new.py -> test_new
  
  TEST_CLASS is the name of the Python class containing the tests.
  
  test_1, test2... replace with the name of individual tests that the new test class contains. 

Example:

```javascript
test_main_page: [
    "TestMainPage",
    "test_create_notebook",
    "test_left_tabs",
    "test_sub_menu",
    "test_top_menu",
    "test_tutorials"
  ]
```
