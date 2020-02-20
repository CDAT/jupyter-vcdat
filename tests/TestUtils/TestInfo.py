import glob
import os
import pathlib
import subprocess

class TestInfo:

    def __init__(self):
        self.MainDir = self.get_main_dir()

    def get_main_dir(self):
        output = subprocess.run(["git rev-parse --show-toplevel"],capture_output=True,text=True,shell=True)
        return output.stdout.rstrip()


    def list_test_files(self):
        test_files = {}
        for test_file in glob.glob("{}/tests/test*.py".format(MAIN_DIR)):
            test_name = os.path.basename(test_file)[:-3]
            test_files[test_name] = ""
            print(os.path.basename(test_file)[:-3])


    def get_package_version(self):
        output = subprocess.run(
            ["node -pe \"require(\'{}/package.json\').version\"".format(MAIN_DIR)],
            capture_output=True,
            text=True,
            shell=True)
        print(output.stdout.rstrip())

def main():
    print(MAIN_DIR)
    list_test_files()
    get_package_version()


if __name__ == '__main__':
    MAIN_DIR = get_main_dir()
    main()
