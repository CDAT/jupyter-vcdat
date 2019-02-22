const MAX_SLABS = 2;
const BASE_URL = "/vcs";
const READY_KEY = "vcdat_ready";
const FILE_PATH_KEY = "vcdat_file_path";
const IMPORT_CELL_KEY = "vcdat_imports";
const VARIABLES_LOADED_KEY = "vcdat_variables_loaded";
const REQUIRED_MODULES = "'lazy_import','cdms2','vcs'";

const GET_VARS_CMD =
  'import __main__\n\
import json\n\
def variables():\n\
    out = []\n\
    for nm, obj in __main__.__dict__.items():\n\
        if isinstance(obj, cdms2.MV2.TransientVariable):\n\
            out+=[nm]\n\
    return out\n\
def graphic_methods():\n\
    out = {}\n\
    for typ in vcs.graphicsmethodlist():\n\
        out[typ] = vcs.listelements(typ)\n\
    return out\n\
def templates():\n\
    return vcs.listelements("template")\n\
def list_all():\n\
    out = {}\n\
    out["variables"] = variables()\n\
    out["gm"] = graphic_methods()\n\
    out["template"] = templates()\n\
    return out\n\
output = "{}|{}|{})".format(variables(),templates(),graphic_methods())';

const REFRESH_NAMES_CMD =
  "import __main__\n\
def variables():\n\
  out = []\n\
  for nm, obj in __main__.__dict__.items():\n\
    if isinstance(obj, cdms2.MV2.TransientVariable):\n\
      out+=[nm]\n\
  return out\n\
output = variables()";

const CHECK_MODULES_CMD = `import types\n\
required = [${REQUIRED_MODULES}]\n\
def imports():\n\
  for name, val in globals().items():\n\
    if isinstance(val, types.ModuleType):\n\
      yield val.__name__\n\
found = list(imports())\n\
output = list(set(required)-set(found))`;

const LIST_CANVASES_CMD = `import __main__\n
def canvases():\n\
  out = []\n\
  for nm, obj in __main__.__dict__.items():\n\
    if isinstance(obj, vcs.Canvas.Canvas):\n\
      out+=[nm]\n\
  return out\n\
output = canvases()`;

const REFRESH_VAR_INFO = `import __main__\n\
import json\n\
def variables():\n\
  out = []\n\
  for nm, obj in __main__.__dict__.items():\n\
    if isinstance(obj, cdms2.MV2.TransientVariable):\n\
      out+=[nm]\n\
  return out\n\
vars = variables()\n\
outVars = {}\n\
for vname in vars:\n\
  var = __main__.__dict__[vname]\n\
  # Get cdmsID for the variable\n\
  if hasattr(var, 'id'):\n\
    cdmsID = var.id\n\
  else:\n\
    cdmsID = ""\n\
  # Get a displayable name for the variable\n\
  if hasattr(var, 'long_name'):\n\
    name = var.long_name\n\
  elif hasattr(var, 'title'):\n\
    name = var.title\n\
  elif hasattr(var, 'id'):\n\
    name = var.id\n\
  else:\n\
    name = vname\n\
  if hasattr(var, 'units'):\n\
    units = var.units\n\
  else:\n\
    units = 'Unknown'\n\
  axisList = []\n\
  for axis in var.getAxisList():\n\
    axisList.append(axis.id)\n\
  lonLat = None\n\
  if var.getLongitude() and var.getLatitude() and \
    not isinstance(var.getGrid(), cdms2.grid.AbstractRectGrid):\n\
    # for curvilinear and generic grids\n\
    # 1. getAxisList() returns the axes and\n\
    # 2. getLongitude() and getLatitude() return the lon,lat variables\n\
    lonName = var.getLongitude().id\n\
    latName = var.getLatitude().id\n\
    lonLat = [lonName, latName]\n\
    # add min/max for longitude/latitude\n\
    if (lonName not in outVars):\n\
        outVars[lonName] = {}\n\
    lonData = var.getLongitude()[:]\n\
    outVars[lonName]['bounds'] = \
    [float(np.amin(lonData)), float(np.amax(lonData))]\n\
    if (latName not in outVars):\n\
        outVars[latName] = {}\n\
    latData = var.getLatitude()[:]\n\
    outVars[latName]['bounds'] = \
    [float(np.amin(latData)), float(np.amax(latData))]\n\
  if (isinstance(var.getGrid(), cdms2.grid.AbstractRectGrid)):\n\
    gridType = 'rectilinear'\n\
  elif (isinstance(var.getGrid(), cdms2.hgrid.AbstractCurveGrid)):\n\
    gridType = 'curvilinear'\n\
  elif (isinstance(var.getGrid(), cdms2.gengrid.AbstractGenericGrid)):\n\
    gridType = 'generic'\n\
  else:\n\
    gridType = None\n\
  if (vname not in outVars):\n\
    outVars[vname] = {}\n\
  outVars[vname]['cdmsID'] = cdmsID\n\
  outVars[vname]['name'] = name\n\
  outVars[vname]['shape'] = var.shape\n\
  outVars[vname]['units'] = units\n\
  outVars[vname]['axisList'] = axisList\n\
  outVars[vname]['lonLat'] = lonLat\n\
  outVars[vname]['gridType'] = gridType\n\
  if ('bounds' not in outVars[vname]):\n\
    outVars[vname]['bounds'] = None\n\
outAxes = {}\n\
reader = cdms2.open('clt.nc')\n\
for aname in reader.axes:\n\
  axis = reader.axes[aname]\n\
  # Get a displayable name for the variable\n\
  if hasattr(axis, 'id'):\n\
    name = axis.id\n\
  else:\n\
    name = aname\n\
  if hasattr(axis, 'units'):\n\
    units = axis.units\n\
  else:\n\
    units = 'Unknown'\n\
  outAxes[aname] = {\n\
    'name': name,\n\
    'shape': axis.shape,\n\
    'units': units,\n\
    'modulo': axis.getModulo(),\n\
    'moduloCycle': axis.getModuloCycle(),\n\
    'data': axis.getData().tolist(),\n\
    'isTime': axis.isTime()\n\
  }\n\
reader.close()\n\
var = None\n\
output = json.dumps({\n\
  'vars': outVars,\n\
  'axes': outAxes\n\
  })`;

const GET_FILE_VARIABLES = `import json\n\
outVars = {}\n\
for vname in reader.variables:\n\
  var = reader.variables[vname]\n\
  # Get cdmsID for the variable\n\
  if hasattr(var, 'id'):\n\
    cdmsID = var.id\n\
  else:\n\
    cdmsID = ""\n\
  # Get a displayable name for the variable\n\
  if hasattr(var, 'long_name'):\n\
    name = var.long_name\n\
  elif hasattr(var, 'title'):\n\
    name = var.title\n\
  elif hasattr(var, 'id'):\n\
    name = var.id\n\
  else:\n\
    name = vname\n\
  if hasattr(var, 'units'):\n\
    units = var.units\n\
  else:\n\
    units = 'Unknown'\n\
  axisList = []\n\
  for axis in var.getAxisList():\n\
    axisList.append(axis.id)\n\
  lonLat = None\n\
  if var.getLongitude() and var.getLatitude() and \
    not isinstance(var.getGrid(), cdms2.grid.AbstractRectGrid):\n\
    # for curvilinear and generic grids\n\
    # 1. getAxisList() returns the axes and\n\
    # 2. getLongitude() and getLatitude() return the lon,lat variables\n\
    lonName = var.getLongitude().id\n\
    latName = var.getLatitude().id\n\
    lonLat = [lonName, latName]\n\
    # add min/max for longitude/latitude\n\
    if (lonName not in outVars):\n\
        outVars[lonName] = {}\n\
    lonData = var.getLongitude()[:]\n\
    outVars[lonName]['bounds'] = \
    [float(np.amin(lonData)), float(np.amax(lonData))]\n\
    if (latName not in outVars):\n\
        outVars[latName] = {}\n\
    latData = var.getLatitude()[:]\n\
    outVars[latName]['bounds'] = \
    [float(np.amin(latData)), float(np.amax(latData))]\n\
  if (isinstance(var.getGrid(), cdms2.grid.AbstractRectGrid)):\n\
    gridType = 'rectilinear'\n\
  elif (isinstance(var.getGrid(), cdms2.hgrid.AbstractCurveGrid)):\n\
    gridType = 'curvilinear'\n\
  elif (isinstance(var.getGrid(), cdms2.gengrid.AbstractGenericGrid)):\n\
    gridType = 'generic'\n\
  else:\n\
    gridType = None\n\
  if (vname not in outVars):\n\
    outVars[vname] = {}\n\
  outVars[vname]['cdmsID'] = cdmsID\n\
  outVars[vname]['name'] = name\n\
  outVars[vname]['shape'] = var.shape\n\
  outVars[vname]['units'] = units\n\
  outVars[vname]['axisList'] = axisList\n\
  outVars[vname]['lonLat'] = lonLat\n\
  outVars[vname]['gridType'] = gridType\n\
  if ('bounds' not in outVars[vname]):\n\
    outVars[vname]['bounds'] = None\n\
outAxes = {}\n\
for aname in reader.axes:\n\
  axis = reader.axes[aname]\n\
  # Get a displayable name for the variable\n\
  if hasattr(axis, 'id'):\n\
    name = axis.id\n\
  else:\n\
    name = aname\n\
  if hasattr(axis, 'units'):\n\
    units = axis.units\n\
  else:\n\
    units = 'Unknown'\n\
  outAxes[aname] = {\n\
    'name': name,\n\
    'shape': axis.shape,\n\
    'units': units,\n\
    'modulo': axis.getModulo(),\n\
    'moduloCycle': axis.getModuloCycle(),\n\
    'data': axis.getData().tolist(),\n\
    'isTime': axis.isTime()\n\
  }\n\
reader.close()\n\
output = json.dumps({\n\
  'vars': outVars,\n\
  'axes': outAxes\n\
  })`;

/*  # Get an id for the variable\n\
  if hasattr(var, 'id'):\n\
    id = var.id\n\
  else:\n\
    id = vname\n\*/

enum NOTEBOOK_STATE {
  Unknown, // The current state of the notebook is unknown and should be updated.
  NoOpenNotebook, // JupyterLab has no notebook opened
  InactiveNotebook, // No notebook is currently active
  ActiveNotebook, // An active notebook, but needs imports cell
  NoSession, // The active notebook doesn't have a client session running
  ImportsReady, // Has imports cell, but they need to be run
  VCS_Ready // The notebook is ready for code injection
}

export {
  MAX_SLABS,
  BASE_URL,
  READY_KEY,
  FILE_PATH_KEY,
  IMPORT_CELL_KEY,
  VARIABLES_LOADED_KEY,
  REQUIRED_MODULES,
  GET_VARS_CMD,
  REFRESH_NAMES_CMD,
  REFRESH_VAR_INFO,
  CHECK_MODULES_CMD,
  LIST_CANVASES_CMD,
  GET_FILE_VARIABLES,
  NOTEBOOK_STATE
};
