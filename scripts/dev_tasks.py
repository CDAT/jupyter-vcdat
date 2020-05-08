import utilities as u

MAIN_MENU = {}
TASK_DATA_FILE = "scripts/task_config.json"

MSG_CHROME_DRIVER_ERROR = "Missing Chrome driver path."
MSG_FIREFOX_DRIVER_ERROR = "Missing Firefox driver path."
MSG_FIREFOX_BINARY_ERROR = "Missing Firefox binary path."


def get_task_data(key):
    return u.read_json_item(TASK_DATA_FILE, [key])


def set_task_data(key, value):
    u.modify_json_file(TASK_DATA_FILE, [key], value)


def add_menu(name, parent=MAIN_MENU):
    return add_item(name, parent, {"Back": parent})


def add_item(name, parent=MAIN_MENU, item=""):
    parent[name] = item
    return parent[name]


def show_menu(menu):

    print("Select an option below:")
    first = 1
    last = 1
    valid = True
    keys = list(menu.keys())
    for i, option in enumerate(keys):
        print("{}.  {}".format(i+1, option))
        last += 1
    try:
        val = int(
            input("Enter option [{}-{}] or 0 to quit: ".format(first, last)))
        if val == 0:
            return
        if val < first or val > last:
            valid = False
    except Exception:
        valid = False

    while not valid:
        valid = True
        print("The value you entered is not valid.")
        try:
            val = int(
                input("Enter option [{}-{}] or 0 to quit: ".format(first, last)))
            if val == 0:
                return
            if val < first or val > last:
                valid = False
        except Exception:
            valid = False

    option = keys[val-1]
    item = menu[option]
    if type(item) is dict:
        show_menu(item)
    elif type(item) is str:
        if item == "":
            cmd = "echo Option: '{}' was selected.".format(option)
        else:
            u.run_cmd(cmd, False)
    else:
        item()


def check_version():
    LOCAL_V = u.get_local_version()
    NPM_V = u.get_publish_version()

    if LOCAL_V and NPM_V:
        LOCAL_V = u.version_tuple(LOCAL_V)
        NPM_V = u.version_tuple(NPM_V)
        if LOCAL_V > NPM_V:
            print("Version {} in the package.json looks good!".format(LOCAL_V))
        else:
            raise(Exception("""
            Version ${lv} in package.json is not newer than npm
            version of ${nv} and will cause Publish job to fail.
            You should update version ${lv} in package.json
            to a version greater than ${nv}""".format(lv=LOCAL_V, nv=NPM_V)))
    else:
        raise(Exception(("Version values could not be compared: Local:"
                         " {}, NPM: {}").format(LOCAL_V, NPM_V)))


# This will install the packages needed to run the test suite

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


def main():

    # Update menu
    CMD_UPDATE_DEPLOYMENT = "python ./scripts/deploy_update.py"
    CMD_UPDATE_TAGS = "python ./scripts/update_tags.py"
    MENU = add_menu("Update")
    add_item("Update Deployment Files", MENU, CMD_UPDATE_DEPLOYMENT)
    add_item("Update Test Suite Tags", MENU, CMD_UPDATE_TAGS)

    # Docker menu
    CMD_LOCAL_DOCKER_BUILD = ("python ./scripts/deploy_docker "
                              "cdat/vcdat:local -l --run")
    CMD_NPM_DOCKER_BUILD = "python ./scripts/deploy_docker cdat/vcdat:nightly"

    # Actions
    SAY_HELLO = "echo Hello World!"

    DEP = add_menu("Deployment")
    DEP_CONDA = add_menu("Conda", DEP)
    add_item("Build Conda Dev Package", DEP_CONDA)
    add_item("Build Conda Release Package", DEP_CONDA)
    add_item("Run Conda Deployment", DEP_CONDA)
    DOCKER = add_menu("Docker", DEP)
    add_item("Build/Run Docker Dev Image", DOCKER, CMD_LOCAL_DOCKER_BUILD)
    add_item("Build Docker Official Image", DOCKER, CMD_NPM_DOCKER_BUILD)
    TESTING = add_menu("Testing")
    add_item("Run Tests", TESTING)
    add_item("Test Docker", TESTING)
    UPDATES = add_menu("Updates")
    add_item("Run Tests", UPDATES)
    add_item("Test Docker", UPDATES)
    add_item("Hello", MAIN_MENU, SAY_HELLO)

    show_menu(MAIN_MENU)


if __name__ == "__main__":
    main()
