import os
import shlex
import subprocess
import glob
import pathlib


class TestUtils(object):

    def __init__(self):
        super(TestUtils, self).__init__()

    def run_command(self, cmd, join_stderr=True, shell_cmd=False, verbose=True, cwd=None):
        if isinstance(cmd, str):
            cmd = shlex.split(cmd)

        if join_stderr:
            stderr_setting = subprocess.STDOUT
        else:
            stderr_setting = subprocess.PIPE

        if cwd is None:
            current_wd = os.getcwd()
        else:
            current_wd = cwd

        P = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=stderr_setting,
                             bufsize=0, cwd=current_wd, shell=shell_cmd)
        out = []
        while P.poll() is None:
            read = P.stdout.readline().rstrip()
            decoded_str = read.decode('utf-8')
            out.append(decoded_str)
            if verbose:
                print(decoded_str)

        ret_code = P.returncode
        return(ret_code, out)
