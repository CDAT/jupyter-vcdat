import re

from Utils import TestUtils

class JupyterUtils(TestUtils):

    def __init__(self):
        super(JupyterUtils, self).__init__()

    def get_server(self):
        cmd = "jupyter notebook list"

        ret_code, output = self.run_command(cmd)
        server_line = output[1]
        match_obj = re.match(r'(.*)\s+::\s+', server_line)
        server = match_obj.group(1)
        print("xxx xxx server: {s}".format(s=server))
        return server

