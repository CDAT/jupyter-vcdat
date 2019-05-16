import { Utilities } from "./Utilities";
export const MAX_SLABS: number = 2;
export const BASE_URL: string = "/vcs";
export const READY_KEY: string = "vcdat_ready";
export const EXTENSIONS: string[] = [
  ".nc",
  ".nc3",
  ".nc4",
  ".ctl",
  ".dic",
  ".pp",
  ".cdf"
];

export const EXTENSIONS_REGEX: RegExp = Utilities.filenameFilter(EXTENSIONS);
export const OUTPUT_RESULT_NAME = "_private_vcdat_output";
export const FILE_PATH_KEY: string = "vcdat_file_path";
export const IMPORT_CELL_KEY: string = "vcdat_imports";
export const CANVAS_CELL_KEY: string = "vcdat_canvases";
export const READER_CELL_KEY: string = "vcdat_readers";
export const SELECTED_VARIABLES_KEY: string = "selected_variables";
export const DATA_LIST_KEY: string = "data_variable_file_paths";
export const VARIABLE_ALIASES_KEY: string = "variable_aliases";
export const VARIABLE_SOURCES_KEY: string = "variable_source_names";
export const GRAPHICS_METHOD_KEY: string = "graphics_method_selected";
export const TEMPLATE_KEY: string = "template_selected";
export const VARIABLES_LOADED_KEY: string = "vcdat_loaded_variables";
export const REQUIRED_MODULES: string = '["cdms2","vcs","sidecar"]';

export const CANVAS_DIMENSIONS_CMD: string = `${OUTPUT_RESULT_NAME}=[canvas.width,canvas.height]`;

export const CHECK_VCS_CMD: string = `import __main__\n\
try:\n\
  for nm, obj in __main__.__dict__.items():\n\
    if isinstance(obj, cdms2.MV2.TransientVariable):\n\
      ${OUTPUT_RESULT_NAME}=True\n\
      break\n\
except:\n\
  ${OUTPUT_RESULT_NAME}=False\n`;

export const REFRESH_NAMES_CMD = `import __main__\n\
import json\n\
def variables():\n\
  out = []\n\
  for nm, obj in __main__.__dict__.items():\n\
    if isinstance(obj, cdms2.MV2.TransientVariable):\n\
      out+=[nm]\n\
  return out\n\
${OUTPUT_RESULT_NAME} = json.dumps(variables())`;

export const REFRESH_GRAPHICS_CMD: string = `import __main__\n\
import json\n\
def graphic_methods():\n\
  out = {}\n\
  for type in vcs.graphicsmethodlist():\n\
    out[type] = vcs.listelements(type)\n\
  return out\n\
${OUTPUT_RESULT_NAME} = json.dumps(graphic_methods())`;

export const REFRESH_TEMPLATES_CMD: string = `import __main__\n\
import json\n\
${OUTPUT_RESULT_NAME} = json.dumps(vcs.listelements('template'))`;

export const CHECK_MODULES_CMD: string = `import types\n\
import json\n\
required = ${REQUIRED_MODULES}\n\
def imports():\n\
  for name, val in globals().items():\n\
    if isinstance(val, types.ModuleType):\n\
      yield val.__name__\n\
found = list(imports())\n\
${OUTPUT_RESULT_NAME} = json.dumps(list(set(required)-set(found)))`;

export const LIST_CANVASES_CMD: string = `import __main__\n\
import json\n\
def canvases():\n\
  out = []\n\
  for nm, obj in __main__.__dict__.items():\n\
    if isinstance(obj, vcs.Canvas.Canvas):\n\
      out+=[nm]\n\
  return out\n\
${OUTPUT_RESULT_NAME} = json.dumps(canvases())`;

export const REFRESH_VAR_CMD: string = `import __main__\n\
import json\n\
import cdms2\n\
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
  outVars[vname]['name'] = name\n\
  outVars[vname]['pythonID'] = id(var)\n\
  outVars[vname]['shape'] = var.shape\n\
  outVars[vname]['units'] = units\n\
  outVars[vname]['axisList'] = axisList\n\
  outVars[vname]['lonLat'] = lonLat\n\
  outVars[vname]['gridType'] = gridType\n\
  if ('bounds' not in outVars[vname]):\n\
    outVars[vname]['bounds'] = None\n\
var = None\n\
${OUTPUT_RESULT_NAME} = json.dumps(outVars)`;

export const GET_AXIS_INFO_CMD: string = `
outAxes = {}\n\
for aname in reader.axes:\n\
  axis = reader.axes[aname]\n\
  if len(axis) < 1000:\n\
    axis_data = axis[:].tolist()\n\
  else:\n\
    axis_data = None\n\
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
    'data': axis_data,\n\
    'min': float(axis[:].min()),\n\
    'max': float(axis[:].max()),\n\
    'isTime': axis.isTime()\n\
  }\n\
aname = None\n\
${OUTPUT_RESULT_NAME} = json.dumps(outAxes)`;

export const GET_VARIABLES_CMD: string = `outVars = {}\n\
for vname in reader.variables:\n\
  var = reader.variables[vname]\n\
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
  outVars[vname]['name'] = name\n\
  outVars[vname]['pythonID'] = id(var)\n\
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
  if len(axis) < 1000:\n\
    axis_data = axis[:].tolist()\n\
  else:\n\
    axis_data = None\n\
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
    'data': axis_data,\n\
    'min': float(axis[:].min()),\n\
    'max': float(axis[:].max()),\n\
    'isTime': axis.isTime()\n\
  }\n\
  var = None\n\
reader.close()\n\
${OUTPUT_RESULT_NAME} = json.dumps({\n\
  'vars': outVars,\n\
  'axes': outAxes\n\
  })`;

export const BASE_GRAPHICS: { [dataName: string]: string[] } = {
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
  "3d_dual_scalar": ["default"],
  "3d_scalar": ["default", "Hovmoller3D"],
  "3d_vector": ["default"],
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
  isoline: [
    "a_isoline",
    "a_lambert_isoline",
    "a_mollweide_isoline",
    "a_polar_isoline",
    "a_robinson_isoline",
    "default",
    "P_and_height",
    "polar",
    "quick"
  ],
  meshfill: [
    "a_lambert_meshfill",
    "a_meshfill",
    "a_mollweide_meshfill",
    "a_polar_meshfill",
    "a_robinson_meshfill",
    "default"
  ],
  scatter: ["a_scatter_scatter_", "default_scatter_", "quick_scatter"],
  streamline: ["default"],
  taylordiagram: ["default"],
  vector: ["default"],
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
  yxvsx: [
    "a_1d",
    "a_xvsy_xvsy_",
    "a_yxvsx_yxvsx_",
    "blue_yxvsx",
    "default",
    "default_xvsy_",
    "default_yxvsx_",
    "red_yxvsx"
  ]
};

export const BASE_TEMPLATES: string[] = [
  "default",
  "ASD",
  "ASD_dud",
  "BL_of6_1legend",
  "BLof6",
  "BR_of6_1legend",
  "BRof6",
  "LLof4",
  "LLof4_dud",
  "LRof4",
  "LRof4_dud",
  "ML_of6",
  "ML_of6_1legend",
  "MR_of6",
  "MR_of6_1legend",
  "UL_of6_1legend",
  "ULof4",
  "ULof4_dud",
  "ULof6",
  "UR_of6",
  "UR_of6_1legend",
  "URof4",
  "URof4_dud",
  "bold_mid_of3",
  "bold_top_of3",
  "boldbot_of3_l",
  "boldmid_of3_l",
  "boldtop_of3_l",
  "bot_of2",
  "deftaylor",
  "hovmuller",
  "mollweide2",
  "no_legend",
  "polar",
  "por_botof3",
  "por_botof3_dud",
  "por_midof3",
  "por_midof3_dud",
  "por_topof3",
  "por_topof3_dud",
  "quick",
  "top_of2"
];

// Specifies the states of the Jupyterlab main area tab/notebook
export enum NOTEBOOK_STATE {
  Unknown, // The current state of the notebook is unknown and should be updated.
  NoOpenNotebook, // JupyterLab has no notebook opened
  InactiveNotebook, // No notebook is currently active
  ActiveNotebook, // An active notebook, but needs imports cell
  NoSession, // The active notebook doesn't have a client session running
  InitialCellsReady, // Has imports cell, but they need to be run
  VCS_Ready // The notebook is ready for code injection
}

// Specifies valid plot export formats
export type EXPORT_FORMATS = "png" | "pdf" | "svg" | "ps" | "";
export type IMAGE_UNITS = "px" | "in" | "cm" | "mm" | "dot";
