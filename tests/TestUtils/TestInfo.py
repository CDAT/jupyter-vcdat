import glob
import os
import subprocess


class TestInfo:

    def __init__(self):
        self.MainDir = self.get_main_dir()

    def get_main_dir(self):
        output = subprocess.run(
            ["git rev-parse --show-toplevel"], capture_output=True, text=True, shell=True)
        return output.stdout.rstrip()

    def list_test_files(self):
        test_files = {}
        for test_file in glob.glob("{}/tests/test*.py".format(self.MainDir)):
            test_name = os.path.basename(test_file)[:-3]
            test_files[test_name] = ""
            print(os.path.basename(test_file)[:-3])

    def get_package_version(self):
        output = subprocess.run(
            ["node -pe \"require(\'{}/package.json\').version\"".format(self.MainDir)],
            capture_output=True,
            text=True,
            shell=True)
        print(output.stdout.rstrip())


def main():
    test_info = TestInfo()
    test_info.list_test_files()
    test_info.get_package_version()


if __name__ == '__main__':
    main()
