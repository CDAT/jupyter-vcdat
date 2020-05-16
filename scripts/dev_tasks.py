import sys
import argparse
import utilities as u


TASK_DATA_FILE = "scripts/task_config.json"
MAIN_DIR = u.get_main_dir()


def get_task_data(key):
    return u.read_json_item(TASK_DATA_FILE, [key])


def set_task_data(key, value):
    u.modify_json_file(TASK_DATA_FILE, [key], value)


def make_meta_yaml(version, branch, build):
    cmd = ("python -c \"import deploy_update as du;du.create_meta_yaml('"
           "{}','{}','{}')\"".format(version, branch, build))
    try:
        u.run_cmd(cmd)
    except Exception:
        sys.exit(1)


def check_version():
    LOCAL_V = u.get_local_version()
    NPM_V = u.get_publish_version("nightly")

    if LOCAL_V and NPM_V:
        L_V = u.version_tuple(LOCAL_V)
        N_V = u.version_tuple(NPM_V)
        if L_V > N_V:
            print(f"Remote version: {NPM_V}\nLocal version: {LOCAL_V}")
            print(f"Version {LOCAL_V} in the package.json looks good!")
        else:
            print(f"Version {LOCAL_V} in package.json is not newer "
                  f"than npm version of {NPM_V} and will cause publish job to fail. "
                  f". You should update version {LOCAL_V} in package.json "
                  f"to a version greater than {NPM_V}")
            sys.exit(1)
    else:
        print(("Version values could not be compared:"
               f" Local: {LOCAL_V}, NPM: {NPM_V}"))
        sys.exit(1)


# Runs the test suite using specified test names
def run_tests(tests, verbose):

    # Collect test file, class and function info
    test_info = u.get_test_info()
    unzipped = list(zip(*test_info))
    all_groups = list(dict.fromkeys(unzipped[0]))  # Remove duplicates
    all_tests = unzipped[2]

    test_idx = []
    group = {}

    if not tests:  # If no test specified, run them all
        tests = all_groups

    if type(tests) == str:
        tests = [tests]
    # Read through test input to determine test, or test group
    for t in tests:
        if t in all_groups:  # input is a test group
            # Only add group if it hasn't been added before
            if t not in group.keys():
                groups_tests = []
                for idx, info in enumerate(test_info):
                    if info[0] == t:
                        groups_tests.append(idx)
                        if idx not in test_idx:
                            test_idx.append(idx)
                group[t] = groups_tests  # Add group and it's tests
        elif t in all_tests:  # Input was a test
            idx = all_tests.index(t)  # Get the index
            if idx not in test_idx:  # Add to list if not added already
                test_idx.append(idx)
        else:
            # It wasn't a group or test, so not recongized
            print(("Test: {} was not found...\n"
                   "\nAvailable test groups:").format(t))
            print(*all_groups, sep="\n")
            print("\nAvailable individual tests:")
            print(*all_tests, sep="\n")
            raise(Exception("Test Not Found!"))

    try:
        log = " --nologcapture "  # Option to turn off log when verbose is false
        if verbose:  # Run test groups first, then individual tests
            log = ""
            for g in group.keys():
                cmd = ("python scripts/run_tests.py"
                       " -H -v 2 tests/${}.py").format(g)
                for t in group[g]:  # Remove test group tests from list
                    test_idx.remove(t)
                u.run_cmd(cmd, False, True)

        for idx in test_idx:
            info = test_info[idx]
            cmd = ("nosetests{}-s tests/{}.py:{}.{}"
                   ).format(log, info[0], info[1], info[2])
            u.run_cmd(cmd)
    except Exception as e:
        print(e)


def test_chrome(tests, verbose=False, env_ready=False):
    print("===============CHROME TESTS BEGIN===============")
    if env_ready:  # Environment variables are already set
        driver = u.get_env_variable("BROWSER_DRIVER")
        if not driver:
            raise(Exception("The chrome driver path is not set. Install test tools."))
        print("Driver: ${}".format(driver))
    else:  # Need to set environment variables
        driver = get_task_data("chrome_driver")
        if not driver:
            print(MSG_CHROME_DRIVER_ERROR)
            driver = u.get_shell_input(("Please enter path to Chrome driver "
                                        "(empty to cancel): "))
            if driver:
                set_task_data("chrome_driver", "driver")
            else:
                return
        # Prepare environment variables for tests
        u.set_env_variable("BROWSER_TYPE", "chrome")
        u.set_env_variable("BROWSER_MODE", "--foreground")
        u.set_env_variable("BROWSER_DRIVER", driver)

    run_tests(tests, verbose)


AVAILABLE_TASKS = {
    "list": "Lists out available tasks.",
    "check_version": ("Checks the local npm version against latest published "
                      "version to make sure the local version is newer."),
    "make_meta_yaml": "Builds the meta.yaml file used for conda recipe."
}


def print_tasks():
    print(*[k for k in AVAILABLE_TASKS.keys()], sep="\n")


def run_task(name, args):
    if name not in AVAILABLE_TASKS.keys():
        raise(Exception(f"The task '{name}' could not be found."))
    else:
        if name == "list":
            print_tasks()
        else:
            try:
                globals()[name](*args)
            except Exception as e:
                print(e)


def main():

    prog = "./tasks.sh"
    descr = ("This tool runs developer tasks.")
    parser = argparse.ArgumentParser(prog, None, descr)
    group = parser.add_mutually_exclusive_group()

    # Add argument options
    parser.add_argument("task", help="name of task to run",
                        choices=AVAILABLE_TASKS.keys())
    parser.add_argument("args", nargs='*',
                        help="arguments to use for task")
    group.add_argument("--task-help", "-th", action="store_true",
                       help="show help message for specific task")
    args = parser.parse_args()

    TASK = args.task
    ARGS = args.args

    if args.task_help:
        print(AVAILABLE_TASKS[TASK])
        return

    run_task(TASK, ARGS)


if __name__ == "__main__":
    main()
