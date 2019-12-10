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
 * If ANY option is not undefined, it will return that option's value or a default.
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
  const output: string = await sh(code, { async: true, silent });
  return output.trimRight();
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

    if (tsFile && pyFile) {
      command = `npx tslint ${tsOpts} ${tsFile}\nflake8 ${pyOpts} ${pyFile}`;
    } else if (tsFile) {
      command = `npx tslint ${tsOpts} ${tsFile}`;
    } else if (pyFile) {
      command = `flake8 ${pyOpts} ${pyFile}`;
    } else {
      command = `npx tslint ${tsOpts} 'src/**/*.{ts,tsx}'\nflake8 ${pyOpts} *.py`;
    }

    await shell(`${command}`);
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

cli({ checkVersion, updateTags, format, lint });
