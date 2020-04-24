import os
import subprocess


class OSTypes():
    Unknown = 0
    MacOS = 1
    Linux = 2


def run_cmd(cmd):
    try:
        output = subprocess.run(
            [cmd], capture_output=True, text=True, shell=True)
        return output.stdout.rstrip()
    except Exception as e:
        print(e)
        return None


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
