import json
import subprocess


class OSTypes():
    Unknown = 0
    MacOS = 1
    Linux = 2


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


def get_main_dir():
    try:
        return run_cmd("git rev-parse --show-toplevel")
    except Exception as e:
        print(e)
        return ''


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


# This will modify the specified json file to change a nested key/value pair.
# To specify which value, use a list starting from outermost to innermost key.
# Ex]: File.json has {a: {b: {c: 5}, d: {e: 3}}}. To change c: 5 into c: 7, use:
# modify_json_file(file, ['a','b','c'], 7). This will look in 'a', then 'b' and
# then will modify 'c''s value to 7.
# NOTE if the keys specified don't exist, they will be created.
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

    # Read package.json into dict
    with open(path, 'r') as f:
        data = json.load(f)

    # Perform modification and write to file
    try:
        data = go_deeper(data, keylist, value)
        with open(path, 'w') as f:
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
