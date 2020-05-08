import os
import ast
import glob
import json
import subprocess


class OSTypes():
    Unknown = 0
    MacOS = 1
    Linux = 2


class Memoize:
    def __init__(self, f):
        self.f = f
        self.memo = {}

    def __call__(self, *args):
        if args not in self.memo:
            self.memo[args] = self.f(*args)
        # Warning: You may wish to do a deepcopy here if returning objects
        return self.memo[args]


def run_cmd(cmd, hide=True, print_cmd=False):
    try:
        if print_cmd:
            print(cmd)
        output = subprocess.run([cmd], check=True, capture_output=hide,
                                text=True, shell=True)
        if hide:
            return output.stdout.rstrip()
        return None
    except Exception as e:
        raise(e)


def get_shell_input(prompt):
    try:
        cmd = "read -e -p '{}' INPUT ; echo $INPUT".format(prompt)
        output = subprocess.check_output([cmd], text=True, shell=True)
        return output.rstrip()
    except Exception as e:
        raise(e)


def get_os():
    try:
        OS = run_cmd("echo $OSTYPE")
        if OS == 'linux-gnu':
            return OSTypes.Linux
        else:
            return OSTypes.MacOS
    except Exception as e:
        print(e)
        return OSTypes.Unknown


def get_env_variable(var_name):
    try:
        return os.environ[var_name]
    except Exception:
        print("The variable was not found.")
        return None


def set_env_variable(var_name, value):
    os.environ[var_name] = value


@Memoize
def get_main_dir():
    try:
        return run_cmd("git rev-parse --show-toplevel")
    except Exception as e:
        raise(e)


@Memoize
def list_test_files():
    test_files = []
    for test_file in glob.glob("{}/tests/test*.py".format(get_main_dir())):
        test_name = os.path.basename(test_file)
        test_files.append(test_name)
    return test_files


def get_python_test_info(testfile):
    test_path = "{}/tests/{}".format(get_main_dir(), testfile)
    test_name = ""
    test_functions = []
    try:
        # Open and parse test file to get info
        with open(test_path) as file:
            info = ast.parse(file.read())
        class_info = None
        # Get the class info within the test file
        for data in info.body:
            if isinstance(data, ast.ClassDef):
                class_info = data
                test_name = data.name
        # Get function names within the class
        if class_info:
            for f in class_info.body:
                if isinstance(f, ast.FunctionDef):
                    test_functions.append(f.name)

        return test_name, test_functions
    except Exception as e:
        raise(e)


@Memoize
def get_test_info():
    try:
        test_files = list_test_files()
        test_data = []
        for test_file in test_files:
            name, tests = get_python_test_info(test_file)
            group = test_file[:-3]
            test_data.extend([(group, name, test) for test in tests])
        return test_data
    except Exception as e:
        raise(e)


def get_publish_version(tag=None):
    try:
        if tag:
            return run_cmd("npm view jupyter-vcdat@{} version".format(tag))
        else:
            return run_cmd("npm view jupyter-vcdat@latest version".format(tag))
    except Exception as e:
        print(e)
        return ''


def get_local_version():
    try:
        return run_cmd('node -pe \"require(\'./package.json\').version\"')
    except Exception as e:
        print(e)
        return ''


# Converts a simple versioning string like "2.3.12"
# into a tuple: (2,3,12) which can then be used for version
# comparisons
def version_tuple(v):
    filled = []
    for point in v.split("."):
        filled.append(point.zfill(3))
    return tuple(filled)


# This will modify the specified json file to change a nested key/value pair.
# To specify which value, use a list starting from outermost to innermost key.
# Ex]: File.json has {a: {b: {c: 5}, d: {e: 3}}}. To change c: 5 into c: 7, use:
# modify_json_file(file, ['a','b','c'], 7). This will look in 'a', then 'b' and
# then will modify 'c''s value to 7.
# NOTE if the keys specified don't exist, they will be created.
# NOTE if the json file doesn't exist, it will be created.
def modify_json_file(path, keylist, value, format=True, verbose=False):
    # Recursive helper function to go deeper into nested object
    def go_deeper(data, keys, value):
        k = keys[0]
        if len(keys) > 1:
            if k in data:
                data[k] = go_deeper(data[k], keys[1:], value)
            else:
                data[k] = go_deeper({}, keys[1:], value)
        elif len(keys) == 1:
            data[k] = value
        return data

    # Read json file into dict, if file doesn't exist, skip
    try:
        with open(path, 'r') as f:
            data = json.load(f)
    except Exception:
        data = {}

    # Perform modification and write to file
    try:
        data = go_deeper(data, keylist, value)
        with open(path, 'w+') as f:
            json.dump(data, f)
    except Exception as e:
        print(e)

    # Use prettier to format the file (optional)
    if format:
        if verbose:
            print("Formatting using prettier...")
        run_cmd("npx prettier --write {}".format(path))

    if verbose:
        print("{} has been updated!".format(path))


def read_json_item(path, keylist):
    try:
        # Read json file into dict
        with open(path, 'r') as f:
            data = json.load(f)
        # Attempt to get value
        for k in keylist:
            data = data[k]
        return data
    except Exception:
        return None
