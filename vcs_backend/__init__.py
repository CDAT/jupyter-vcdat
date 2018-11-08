"""
A server backend for handling jupyter-vcs frontend requests
"""
from notebook.utils import url_path_join

import cdms2
import numpy as np
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
        """Return a list of variables from the given file name."""
        print('got a get request on path {}'.format(path))
        file_path = self.get_argument('file_path')
        print('file_path = ' + file_path)
    
        reader = cdms2.open(file_path)
        outVars = {}
        for vname in reader.variables:
            var = reader.variables[vname]

            # Get a displayable name for the variable
            if hasattr(var, 'long_name'):
                name = var.long_name
            elif hasattr(var, 'title'):
                name = var.title
            elif hasattr(var, 'id'):
                name = var.id
            else:
                name = vname
            if hasattr(var, 'units'):
                units = var.units
            else:
                units = 'Unknown'
            axisList = []
            for axis in var.getAxisList():
                axisList.append(axis.id)
            lonLat = None
            if var.getLongitude() and var.getLatitude() and \
                    not isinstance(var.getGrid(), cdms2.grid.AbstractRectGrid):
                # for curvilinear and generic grids
                # 1. getAxisList() returns the axes and
                # 2. getLongitude() and getLatitude() return the lon,lat variables
                lonName = var.getLongitude().id
                latName = var.getLatitude().id
                lonLat = [lonName, latName]
                # add min/max for longitude/latitude
                if (lonName not in outVars):
                    outVars[lonName] = {}
                lonData = var.getLongitude()[:]
                outVars[lonName]['bounds'] =\
                  [float(np.amin(lonData)), float(np.amax(lonData))]
                if (latName not in outVars):
                    outVars[latName] = {}
                latData = var.getLatitude()[:]
                outVars[latName]['bounds'] =\
                  [float(np.amin(latData)), float(np.amax(latData))]
            if (isinstance(var.getGrid(), cdms2.grid.AbstractRectGrid)):
                gridType = 'rectilinear'
            elif (isinstance(var.getGrid(), cdms2.hgrid.AbstractCurveGrid)):
                gridType = 'curvilinear'
            elif (isinstance(var.getGrid(), cdms2.gengrid.AbstractGenericGrid)):
                gridType = 'generic'
            else:
                gridType = None
            if (vname not in outVars):
                outVars[vname] = {}
            outVars[vname]['name'] = name
            outVars[vname]['shape'] = var.shape
            outVars[vname]['units'] = units
            outVars[vname]['axisList'] = axisList
            outVars[vname]['lonLat'] = lonLat
            outVars[vname]['gridType'] = gridType
            if ('bounds' not in outVars[vname]):
                outVars[vname]['bounds'] = None
        outAxes = {}
        for aname in reader.axes:
            axis = reader.axes[aname]

            # Get a displayable name for the variable
            if hasattr(axis, 'id'):
                name = axis.id
            else:
                name = aname
            if hasattr(axis, 'units'):
                units = axis.units
            else:
                units = 'Unknown'
            outAxes[aname] = {
                'name': name,
                'shape': axis.shape,
                'units': units,
                'modulo': axis.getModulo(),
                'moduloCycle': axis.getModuloCycle(),
                'data': axis.getData().tolist(),
                'isTime': axis.isTime()
            }
        reader.close()
        response = {
            'vars': outVars,
            'axes': outAxes
        }
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
