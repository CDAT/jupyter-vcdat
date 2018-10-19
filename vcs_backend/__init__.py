"""
A server backend for handling jupyter-vcs frontend requests
"""
from notebook.utils import url_path_join

import cdms2

# from vcs_handlers import *

__version__ = '0.0.1'

from notebook.base.handlers import APIHandler

import tornado.gen as gen


class VCSHandler(APIHandler):
    """
    Handler for vcs requests from the frontend of the extension
    """
    @gen.coroutine
    def get(self, path=''):
        print('got a get request on path {}'.format(path))
        file_path = self.get_argument('file_path')
        print('file_path = ' + file_path)
        datafile = cdms2.open(file_path)
        response = { 'variables': [x for x in datafile.variables.keys()] }
        print('sending response ' + str(response))
        self.write(response)

def _jupyter_server_extension_paths():
    return [{
        'module': 'vcs_backend'
    }]

def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    base_url = web_app.settings['base_url']
    endpoint = url_path_join(base_url, r'/vcs')
    handlers = [(endpoint + "(.*)", VCSHandler)]
web_app.add_handlers('.*$', handlers)