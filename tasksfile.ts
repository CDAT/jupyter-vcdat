import { cli, help, sh } from "tasksfile";
import { dedent } from "ts-dedent";
import compareVersions from "compare-versions";
import { ICLIOptions } from "@pawelgalazka/cli";

// Place to store the messages for different commands.
const MESSAGE = {
  checkVersion: {
    valid: (version: string) => {
      return `Version ${version} in the package.json looks good!"`;
    },
    error: (localVersion: string, npmVersion: string) => {
      return dedent`
        Version ${localVersion} in package.json is not newer than npm
        version of ${npmVersion} and will cause Publish job to fail.
        You should update version ${localVersion} in package.json
        to a version greater than ${npmVersion}
      `;
    }
  }
};

// Which selenium tests there are to run
const TESTS: { [name: string]: string[] } = {
  test_locators: [
    "TestLocators",
    "test_jupyter_top_menu_locators",
    "test_jupyter_left_tab_locators",
    "test_launcher_locators",
    "test_file_browser_buttons",
    "test_new_notebook",
    "test_vcdat_panel_locators",
    "test_file_browser_locators"
  ],
  test_load_a_variable: ["TestLoadVariable",
  "test_load_a_variable"],
  test_load_variables_popup_locators: [
    "TestLoadVariablesPopUpLocators",
    "test_click_a_variable",
    "test_click_a_variable_axes",
    "test_adjust_a_variable_axes"
  ],
  test_plot_locators: [
    "TestPlot",
    "test_plot",
    "test_select_plot_type",
    "test_select_a_template",
    "test_export_plot",
    "test_export_plot_adjust_unit",
    "test_capture_provenance",
    "test_select_deselect_variable",
    "test_edit_variable"
  ],
  test_edit_axis_locators: ["TestEditAxis", "test_edit_axis"],
  test_file_browser_locators: [
    "TestFileBrowserLocators",
    "test_double_click_on_a_file"
  ],
  test_main_page_locators: ["TestMainPageLocators","test_top_menu_items"],
  test_export_html: [
    "TestExportHTML",
    "test_export_plot_html_via_button",
    "test_export_plot_html_via_nbconvert",
    "test_export_plot_html_via_nbconvert_execute"
  ]
};

const TASK_DATA_PATH: string = ".taskData";

enum TaskData {
  chromeDriver,
  geckoDriver,
  firefoxBinary,
  LENGTH // Length must be last element in enum
}

// Template function to convert string array to format with line breaks
function printArrayVertically(strings: any, array: string[]): string {
  let result: string = ``;

  array.forEach((element: any) => {
    result += `\n${strings[0]}${element}${strings[1]}`;
  });

  return result.slice(1);
}

/**
 * Returns the parameter value, providing a default value if parameter was
 * undefined or if the parameter was boolean (no value assigned to it).
 * @param value The default value to return if parameter has no value.
 * @param option The option to check.
 */
function getOptionValue(value: any, option: any): any {
  if (option && typeof option !== "boolean") {
    return option;
  }
  return value;
}

/**
 * Given a list of options, if all options are undefined, returns undefined
 * If ANY option is not undefined, it will return that option's value,
 * or a default value if the value of the option is a boolean value.
 * @param value The default value to pass if option without value was found.
 * @param options The options passed to the shell function.
 */
function getOptionsValue(value: any, ...options: any[]): any {
  let option: any;
  options.some((opt: any) => {
    option = opt;
    return opt !== undefined; // Exit loop soon as an option is found
  });

  if (option) {
    return getOptionValue(value, option);
  }

  return undefined;
}

//
/**
 * Will run shell command asynchronously, returns trimmed output string.
 * @param code The shell command to run
 * @param silent Whether the shell output should be silent. Default true.
 */
async function run(code: string, silent: boolean = true): Promise<string> {
  let output: string = "";
  try {
    output = await sh(code, { async: true, silent });
  } catch (error) {
    throw error;
  }

  return output ? output.trimRight() : "";
}

/**
 * Will run shell command and allow it's output to print to console.
 * @param code The shell command to run
 * @param silent Whether the shell output should be silent. Default false.
 */
async function shell(code: string, silent: boolean = false): Promise<void> {
  await sh(code, { async: true, nopipe: true, silent });
}

/**
 * Will set the specified task data equal to a value.
 * @param taskData The data to set
 * @param value The value to set for the data
 */
async function setTaskData(taskData: TaskData, value: string): Promise<void> {
  const idx: number = taskData + 1;

  if (!(await checkFileExists(TASK_DATA_PATH))) {
    await run(`seq 1 ${TaskData.LENGTH} > ${TASK_DATA_PATH}`);
  }
  await run(`sed -i '' -e '${idx}s#.*#${value}#' ${TASK_DATA_PATH}`);
}

/**
 * Will get the specified task data value
 * @param taskData The data to get
 */
async function getTaskData(taskData: TaskData): Promise<string> {
  const idx: number = taskData + 1;
  try {
    return await run(`sed "${idx}q;d" ${TASK_DATA_PATH}`);
  } catch (error) {
    return "";
  }
}

/**
 * Gets the package.json version number in the local project directory.
 */
async function getLocalPackageVersion(): Promise<string> {
  return run(`node -pe "require('./package.json').version"`);
}

/**
 * Gets the latest published version number of the specified tag
 * @param tag The tag to look for. Ex: 'nightly' will return latest nightly
 * version number that is published on npm.
 */
async function getPublishedVersion(tag?: string): Promise<string> {
  return run(`npm view jupyter-vcdat${tag ? `@${tag}` : ""} version`);
}

/**
 * Returns true if the file exists
 * @param fileName The file name to check
 */
async function checkFileExists(fileName: string): Promise<boolean> {
  try {
    await run(`test -f ${fileName} && echo "TRUE"`);
  } catch (error) {
    return false;
  }
  return true;
}

/**
 * Prompts user for input and returns the result as a string.
 * @param prompt The message to show user for input.
 */
async function getUserInput(
  prompt: string,
  charLimit?: number
): Promise<string> {
  console.log(prompt);
  if (charLimit) {
    return run(
      `read -e -n ${charLimit} _user_response && echo $_user_response`,
      false
    );
  }
  return run(`read -e _user_response && echo $_user_response`, false);
}

/**
 * Prompts user for a file path, and will continue until user
 * provides a valid path or the user quits.
 * @param prompt The prompt to show when requesting path.
 * @param quitMsg The message to show if user quits.
 * @returns A valid file path, or if user quit, undefined.
 */
async function getValidPath(prompt: string, quitMsg: string): Promise<string> {
  let path: string = await getUserInput(`${prompt} ('q' to quit): `);
  if (path.toLowerCase() === "q") {
    console.log(quitMsg);
    return;
  }
  let valid: boolean = await checkFileExists(path);
  while (!valid) {
    path = await getUserInput(
      `The path was not valid. ${prompt}\n('q' to quit): `
    );
    if (path.toLowerCase() === "q") {
      console.log(quitMsg);
      return;
    }
    valid = await checkFileExists(path);
  }

  return path;
}

/**
 * Runs the specified selenium tests using the chrome browser and driver
 * @param testsToRun An array with the names of the tests to run.
 */
async function testChrome(tests: {
  [groupName: string]: string[];
}): Promise<void> {
  console.log("===============CHROME TESTS BEGIN===============");
  const driver: string = await getTaskData(TaskData.chromeDriver);
  if (!driver) {
    console.error(
      "Missing driver path. To set path, run: \
    npx task installTestTools"
    );
    return;
  }
  const envSetup: string = dedent`
    export BROWSER_TYPE=chrome
    export BROWSER_MODE='--foreground'
    export BROWSER_DRIVER=${driver}
  `;
  let testCmds: string = "";
  let testClass: string = "";
  let testNames: string[] = [];
  const testGroups: string[] = [];
  console.log(tests);
  Object.keys(tests).forEach((testGroup: string) => {
    if (tests[testGroup].length > 0) {
      testClass = TESTS[testGroup][0];
      testNames = tests[testGroup];
      testCmds = testCmds.concat(
        ...testNames.map((test: string) => {
          return ` && nosetests -s tests/${testGroup}.py:${testClass}.${test}`;
        })
      );
    } else {
      testGroups.push(testGroup);
    }
  });

  testCmds = testCmds.concat(
    ...testGroups.map((test: string) => {
      return ` && python run_tests.py -H -v 2 tests/${test}.py`;
    })
  );
  await shell(`${envSetup}${testCmds}`);
}

/**
 * Runs the specified selenium tests using the firefox browser and drivers
 * @param testsToRun An array with the names of the tests to run.
 */
async function testFirefox(tests: {
  [groupName: string]: string[];
}): Promise<void> {
  console.log("=============FIREFOX TESTS BEGIN=============");
  const driver: string = await getTaskData(TaskData.geckoDriver);
  const binary: string = await getTaskData(TaskData.firefoxBinary);
  if (!driver) {
    console.error(
      "Missing driver path. To set path, run: \
    npx task installTestTools"
    );
    return;
  }
  if (!binary) {
    console.error(
      "Missing binary path. To set path, run: \
    npx task installTestTools"
    );
    return;
  }
  const envSetup: string = dedent`
    export BROWSER_TYPE=firefox
    export BROWSER_MODE='--foreground'
    export BROWSER_BINARY=${binary}
    export BROWSER_DRIVER=${driver}
  `;
  let testCmds: string = "";
  let testClass: string = "";
  let testNames: string[] = [];
  const testGroups: string[] = [];
  console.log(tests);
  Object.keys(tests).forEach((testGroup: string) => {
    if (tests[testGroup].length > 0) {
      testClass = TESTS[testGroup][0];
      testNames = tests[testGroup];
      testCmds = testCmds.concat(
        ...testNames.map((test: string) => {
          return ` && nosetests -s tests/${testGroup}.py:${testClass}.${test}`;
        })
      );
    } else {
      testGroups.push(testGroup);
    }
  });

  testCmds = testCmds.concat(
    ...testGroups.map((test: string) => {
      return ` && python run_tests.py -H -v 2 tests/${test}.py`;
    })
  );
  await shell(`${envSetup}${testCmds}`);
}

// Task: checkVersion
async function checkVersion(): Promise<void> {
  try {
    const LOCAL_VCDAT_VERSION: string = await getLocalPackageVersion();
    const NPM_VCDAT_VERSION: string = await getPublishedVersion("nightly");
    if (compareVersions(LOCAL_VCDAT_VERSION, NPM_VCDAT_VERSION) > 0) {
      console.log(MESSAGE.checkVersion.valid(LOCAL_VCDAT_VERSION));
    } else {
      console.error(
        MESSAGE.checkVersion.error(LOCAL_VCDAT_VERSION, NPM_VCDAT_VERSION)
      );
      sh(`exit 1`);
    }
  } catch (error) {
    console.error(error);
  }
}

help(
  checkVersion,
  `Compares package.json version with the version published \
on npm and exits with error if the published version is newer.`,
  {
    params: []
  }
);

// Task: updateTags
function updateTags(options: ICLIOptions): void {
  const log = getOptionValue("tests/component_tags.txt", options.log);
  const source = getOptionValue("src/**/*.tsx", options.source);
  const suffix = getOptionValue("vcdat", options.suffix);

  try {
    sh(
      `python scripts/update_tags.py --log ${log} --source ${source} --suffix ${suffix}`,
      {
        silent: true,
        async: false
      }
    );
  } catch (error) {
    console.error(error);
  }
}

help(updateTags, "Will find and update all className tags in source files.", {
  options: {
    log: `Specify the path where to save the log containing tag names,
    values and thier locations. Default: "tests/component_tags.txt"`,
    source: `The path of the file or files to update. Default: "src/**/*.tsx"`,
    suffix: dedent`The string value to attach to the end of the tags.
    Ex: --suffix='-1234' changes 'tagName' to 'tagName_1234'. Default: "vcdat"
    Note: If you change this, make sure all classNames are updated in test suite.`
  },
  examples: dedent`
  Use the following example for adding and updating tags to components:
    Tag used in file:
      <component id={/* tag<component>*/ "oldComponentID" } />
    Command to update:
      npx task updateTags --suffix=1234
    result:
      <component id={/* tag<component>*/ "component_1234"
  
  Examples that show the syntax for tags (id or class) to components:
    <component id={/* tag<nameForTag>*/ "oldID" } />
      ---> <component id={/* tag<nameForTag>*/ "nameForTag_suffix" }
    <component className={/* tag<newNameForTag> */ "oldClassName" } />
      ---> <component className={/* tag<newNameForTag> */ "newNameForTag_suffix" } />
    <component className={/* tag<otherClass newInsertClass>*/ "otherClass oldClass" } />
      ---> <component className={/* tag<otherClass newInsertClass>*/ "otherClass newInsertClass" } />`
});

// Task: format
async function format(options: ICLIOptions, arg: string): Promise<void> {
  try {
    if (!arg) {
      await shell("npx prettier-tslint fix 'src/**/*.{ts,tsx,css,scss}'");
    } else {
      await shell(`npx prettier-tslint fix ${arg}`);
    }
  } catch (error) {
    console.error(error);
  }
}

help(format, "Format source files using prettier-tslint", {
  params: []
});

// Task: lint
async function lint(options: ICLIOptions): Promise<void> {
  try {
    let command: string = "";
    const tsOpts: string = options.fix
      ? "--fix --project tsconfig.json"
      : "--project tsconfig.json";
    const pyOpts: string = `--show-source --statistics \
--ignore=F999,F405,E121,E123,E126,E226,E24,E402,E704,W504 \
--max-line-length=120`;

    const tsFile: string = getOptionsValue(
      "'src/**/*.{ts,tsx}'",
      options.t,
      options.tsfile
    );
    const pyFile: string = getOptionsValue("*.py", options.p, options.pyfile);

    await checkVersion();
    if (tsFile && pyFile) {
      console.log(`Linting Typescript files and Python files...`);
      command = `npx tslint ${tsOpts} ${tsFile}\nflake8 ${pyOpts} ${pyFile}`;
    } else if (tsFile) {
      console.log("Linting Typescript files...");
      command = `npx tslint ${tsOpts} ${tsFile}`;
    } else if (pyFile) {
      console.log("Linting Python files...");
      command = `flake8 ${pyOpts} ${pyFile}`;
    } else {
      console.log("Linting all Typescript and Python source files...");
      command = `npx tslint ${tsOpts} 'src/**/*.{ts,tsx}'\nflake8 ${pyOpts} *.py`;
    }
    await shell(`${command}`);
    console.log("Done!");
  } catch (error) {
    console.error(error);
  }
}

help(lint, `Performs linting operations on source files.`, {
  params: [],
  options: {
    fix: "<optional> Apply automatic fixes when possible during linting.",
    tsfile: "<optional> Specific file to lint. Default: All source files.",
    t: "<optional> Same as above.",
    pyfile: "<optional> Perform linting of Python source files with flake8.",
    p: "<optional> Same as above."
  },
  examples: dedent`
  To lint and fix specific typescript file:
    npx task lint --fix -t=myfile.ts
  To run linting on all python project files:
    npx task lint -p
  To run linting on specific python file:
    npx task lint -p=my_script.py
  To run linting and fixing on all typescript and python files (default):
    npx task lint --fix -p -t OR npx task lint
  To run lint on specific typescript and specific python file:
    npx task lint -t=myFile.ts -p=anotherFile.py
  `
});

// Task : installTestTools
async function installTestTools(options: ICLIOptions): Promise<void> {
  const firefox: string = getOptionsValue(true, options.f, options.firefox);
  const chrome: string = getOptionsValue(true, options.c, options.chrome);
  const CONDA_ENV: string = await run(`echo $CONDA_DEFAULT_ENV`);
  const CANCEL_PROMPT: string = "Installation cancelled.";
  const CHROME_DRIVER: string = "Please enter path to Chrome selenium driver";
  const GECKO_DRIVER: string = "Please enter path to Firefox selenium driver";
  const GECKO_EXE: string = "Please enter path to the Firefox executable";
  if (CONDA_ENV) {
    const input: string = await getUserInput(
      `Do you want to install test tools in '${CONDA_ENV}' conda environment (y/n)? `
    );

    if (input.toLowerCase().includes("y")) {
      const chrmPath: string = await getValidPath(CHROME_DRIVER, CANCEL_PROMPT);
      await setTaskData(TaskData.chromeDriver, chrmPath);

      const geckoPath: string = await getValidPath(GECKO_DRIVER, CANCEL_PROMPT);
      await setTaskData(TaskData.geckoDriver, geckoPath);

      const firefoxBin: string = await getValidPath(GECKO_EXE, CANCEL_PROMPT);
      await setTaskData(TaskData.firefoxBinary, firefoxBin);

      console.log("Installing...");
      await shell(
        "conda install -c cdat/label/v82 testsrunner cdat_info <<< 'yes' && \
      pip install selenium && pip install pyvirtualdisplay"
      );
    } else {
      console.log(CANCEL_PROMPT);
      return;
    }
  } else {
    console.error(
      "No conda environment active. \
      Activate conda environment containing the jupyter-vcdat installation to test."
    );
    return;
  }
}

help(
  installTestTools,
  `Installs dependencies for running Selenium tests locally.`,
  {
    params: []
  }
);

// Task: test
async function test(options: ICLIOptions, ...tests: string[]): Promise<void> {
  const firefox: string = getOptionsValue(true, options.f, options.firefox);
  const chrome: string = getOptionsValue(true, options.c, options.chrome);

  const mainTests: string[] = Object.keys(TESTS);
  const testsToRun: string[] = tests.length > 0 ? tests : mainTests;
  let error: boolean = false;

  // Print out list of tests if list option set
  if (options.l || options.list) {
    if (tests.length < 1) {
      console.log(
        `Available Tests:\n\n${printArrayVertically`  ${mainTests}`}\n`
      );
    } else {
      testsToRun.forEach((test: string) => {
        if (TESTS[test]) {
          console.log(
            `${TESTS[test][0]}:\n\n${printArrayVertically`  ${TESTS[test].slice(
              1
            )}`}\n`
          );
        } else {
          console.error(`\nError: ${test} is not a test group.`);
        }
      });
    }

    return;
  }

  const testData: { [testGroup: string]: string[] } = {};
  testsToRun.forEach((test: string) => {
    if (TESTS[test]) {
      // Test is a testGroup
      testData[test] = [];
    } else {
      let testFound: boolean = false;
      let tests: string[] = [];

      Object.keys(TESTS).forEach((testGroup: string) => {
        tests = TESTS[testGroup].slice(1);
        if (tests.includes(test)) {
          testFound = true;
          if (testData[testGroup]) {
            testData[testGroup].push(test);
          } else {
            testData[testGroup] = [test];
          }
        }
      });
      if (!testFound) {
        // Return error if test not found
        console.error(`ARGUMENT ERROR: Unrecognized test: ${test}.`);
        error = true;
      }
    }
  });
  if (error) {
    return;
  }

  if (chrome !== firefox) {
    if (firefox) {
      console.log("Running tests for Firefox...");
      await testFirefox(testData);
      console.log("FIREFOX TESTS COMPLETE!!");
    }
    if (chrome) {
      console.log("Running tests for Chrome...");
      await testChrome(testData);
      console.log("CHROME TESTS COMPLETE!!");
    }
  } else {
    console.log("Running tests for Chrome and Firefox...");
    await testFirefox(testData);
    await testChrome(testData);
    console.log("FIREFOX AND CHROME TESTS COMPLETE!!");
  }
}

help(
  test,
  `Runs Selenium automated tests locally. \
If no tests are specified, all available tests will be run. \
If no browser options are specified, both browsers will be used. \
NOTE: You need to have a JupyterLab instance running with no open notebooks \
or running kernels before you start the tests. Otherwise tests may fail.`,
  {
    params: ["tests"],
    "Available tests": printArrayVertically`  ${Object.keys(TESTS)}`,
    options: {
      firefox: "<optional> Run tests using firefox browser.",
      f: "<optional> Same as above.",
      chrome: "<optional> Run tests using chrome browser.",
      c: "<optional> Same as above.",
      list: "<optional> Prints list of available test groups or sub tests.",
      l: "<optional> Same as above."
    },
    examples: dedent`
  This will print out all available test groups:
    npx task test -l
  This will print out available tests for 'test_locators' test group
    npx task test -l test_locators
  This will print out available tests for 'test_locators' and 'test_plot_locators' test groups
    npx task test -l test_locators test_plot_locators
  This will run all test groups in both chrome and firefox:
    npx task test
     --OR--
    npx task test -f -c
  This will run specific test group(s) in chrome and firefox:
    npx task test <test_group> <test_group2> ...
    --OR--
    npx task test -c -f <test_group> <test_group2> ...
  This will run all test groups in chrome only:
    npx task test -c
  This will run specific test group in firefox only:
    npx task test -f <specific_test_group>
  This will run specific test and test group in chrome only:
    npx task test -c <specific_test> <specific_test_group>
  `
  }
);

cli({
  checkVersion,
  updateTags,
  format,
  lint,
  installTestTools,
  test
});
