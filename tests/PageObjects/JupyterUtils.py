import re
import os
import subprocess
import glob
from Utils import TestUtils


class JupyterUtils(TestUtils):
    def __init__(self):
        super(JupyterUtils, self).__init__()
        output = subprocess.run(
            ["git rev-parse --show-toplevel"],
            capture_output=True,
            text=True,
            shell=True,
        )
        self.MAIN_DIR = output.stdout.rstrip()

    def get_server(self):
        cmd = "jupyter notebook list"

        ret_code, output = self.run_command(cmd)
        server_line = output[1]
        match_obj = re.match(r"(.*)\s+::\s+", server_line)
        server = match_obj.group(1)
        return server

    def get_main_dir(self):
        return self.MAIN_DIR

    def list_test_files(self):
        test_files = {}
        for test_file in glob.glob("{}/tests/test*.py".format(self.MAIN_DIR)):
            test_name = os.path.basename(test_file)[:-3]
            test_files[test_name] = test_file
        return test_files

    def get_package_version(self):
        if self.MAIN_DIR:
            cmd = "node -pe \"require('{}/package.json').version\"".format(self.MAIN_DIR)
        else:
            cmd = "node -pe \"require('./package.json').version\""
        output = subprocess.run(
            [cmd],
            capture_output=True,
            text=True,
            shell=True,
        )
        if output.stdout:
            return output.stdout.rstrip()
        else:
            print("An error occurred: {}".format(output.stderr))
            return "Error"
