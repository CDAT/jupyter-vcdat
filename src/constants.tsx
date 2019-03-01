const MAX_SLABS = 2;
const BASE_URL = "/vcs";
const READY_KEY = "vcdat_ready";
const FILE_PATH_KEY = "vcdat_file_path";
const IMPORT_CELL_KEY = "vcdat_imports";
const GRAPHICS_METHOD_KEY = "graphics_method_selected";
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
        out[type] = vcs.listelements(typ)\n\
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

<<<<<<< HEAD
const REFRESH_GRAPHICS_CMD =
  "import __main__\n\
import json\n\
def graphic_methods():\n\
  out = {}\n\
  for type in vcs.graphicsmethodlist():\n\
    out[type] = vcs.listelements(type)\n\
  return out\n\
output = json.dumps(graphic_methods())";

const REFRESH_VARS_CMD =
=======
const REFRESH_NAMES_CMD =
>>>>>>> d303e6bc4652749749c3fe5b9cac5b9694a2a4a8
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

const BASE_GRAPHICS: any = {
  "3d_scalar": ["Hovmoller3D", "default"],
  xvsy: [
    "a_1d",
    "a_xvsy_xvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_xvsy_",
    "default_yxvsx_",
    "red_yxvsx"
  ],
  xyvsy: ["a_xyvsy_xyvsy_", "default_xyvsy_"],
  isoline: [
    "P_and_height",
    "a_isoline",
    "a_lambert_isoline",
    "a_mollweide_isoline",
    "a_polar_isoline",
    "a_robinson_isoline",
    "default",
    "polar",
    "quick"
  ],
  boxfill: [
    "a_boxfill",
    "a_lambert_boxfill",
    "a_mollweide_boxfill",
    "a_polar_boxfill",
    "a_robinson_boxfill",
    "default",
    "polar",
    "quick",
    "robinson"
  ],
  isofill: [
    "a_isofill",
    "a_lambert_isofill",
    "a_mollweide_isofill",
    "a_polar_isofill",
    "a_robinson_isofill",
    "default",
    "polar",
    "quick",
    "robinson"
  ],
  streamline: ["default"],
  "3d_dual_scalar": ["default"],
  meshfill: [
    "a_lambert_meshfill",
    "a_meshfill",
    "a_mollweide_meshfill",
    "a_polar_meshfill",
    "a_robinson_meshfill",
    "default"
  ],
  "3d_vector": ["default"],
  yxvsx: [
    "a_1d",
    "a_xvsy_xvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_xvsy_",
    "default_yxvsx_",
    "red_yxvsx"
  ],
  taylordiagram: ["default"],
  vector: ["default"],
  "1d": [
    "a_1d",
    "a_scatter_scatter_",
    "a_xvsy_xvsy_",
    "a_xyvsy_xyvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_scatter_",
    "default_xvsy_",
    "default_xyvsy_",
    "default_yxvsx_",
    "quick_scatter",
    "red_yxvsx"
  ],
  scatter: ["a_scatter_scatter_", "default_scatter_", "quick_scatter"]
};

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
  GRAPHICS_METHOD_KEY,
  VARIABLES_LOADED_KEY,
  REQUIRED_MODULES,
  GET_VARS_CMD,
<<<<<<< HEAD
  BASE_GRAPHICS,
  REFRESH_GRAPHICS_CMD,
  REFRESH_VARS_CMD,
=======
  REFRESH_NAMES_CMD,
>>>>>>> d303e6bc4652749749c3fe5b9cac5b9694a2a4a8
  REFRESH_VAR_INFO,
  CHECK_MODULES_CMD,
  LIST_CANVASES_CMD,
  GET_FILE_VARIABLES,
  NOTEBOOK_STATE
};
