import { cli, help, sh } from "tasksfile";
import tsDedent from "ts-dedent";
import compareVersions from "compare-versions";
import { ICLIOptions } from "@pawelgalazka/cli";

const MESSAGE = {
  checkVersion: {
    valid: (version: string) => {
      return `Version ${version} in the package.json looks good!"`;
    },
    error: (localVersion: string, npmVersion: string) => {
      return tsDedent`
        Version ${localVersion} in package.json is not newer than npm
        version of ${npmVersion} and will cause Publish job to fail.
        You should update version ${localVersion} in package.json
        to a version greater than ${npmVersion}
      `;
    }
  }
};

async function run(code: string, silent: boolean = true): Promise<string> {
  const output: string = await sh(code, {
    async: true,
    silent
  });
  return output.trimRight();
}

async function shell(code: string, silent: boolean = false): Promise<void> {
  await sh(code, {
    async: true,
    nopipe: true,
    silent
  });
}

async function getLocalPackageVersion(): Promise<string> {
  return run(`node -pe "require('./package.json').version"`);
}

async function getPublishedVersion(tag?: string): Promise<string> {
  return run(`npm view jupyter-vcdat${tag ? `@${tag}` : ""} version`);
}

async function checkVersion(): Promise<void> {
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
}

function updateTags(): void {
  sh("python scripts/update_tags.py --source src/**/*.tsx --suffix vcdat", {
    silent: true,
    async: false
  });
}

async function format(options: ICLIOptions, arg: string): Promise<void> {
  if (!arg) {
    await shell("npx prettier-tslint fix 'src/**/*.{ts,tsx,css,scss}'");
  } else {
    await shell(`npx prettier-tslint fix ${arg}`);
  }
}

help(format, "Format source files using prettier-tslint", {
  params: []
});

cli({ checkVersion, updateTags, format });
