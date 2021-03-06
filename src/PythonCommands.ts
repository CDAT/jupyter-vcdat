import {
  DISPLAY_MODE,
  MAX_DIM_LENGTH,
  OUTPUT_RESULT_NAME,
  REQUIRED_MODULES,
} from "./constants";

// Simple function to prevent variable names from overlapping with user-created names
function safe(baseName: string): string {
  return `${baseName}_F9FY9AE028RRF982`;
}

// PYTHON COMMAND CONSTANTS
export const CANVAS_DIMENSIONS_CMD = `${OUTPUT_RESULT_NAME}=[canvas.width,canvas.height]`;

export const CHECK_PLOT_EXIST_CMD = `import json\n\
try:\n\
	${OUTPUT_RESULT_NAME} = json.dumps(canvas.listelements('display'))\n\
except:\n\
	del ${OUTPUT_RESULT_NAME}\n\
	pass\n`;

export const CHECK_VCS_CMD = `import __main__\n\
try:\n\
for nm, obj in __main__.__dict__.items():\n\
	if isinstance(obj, cdms2.MV2.TransientVariable):\n\
		${OUTPUT_RESULT_NAME}=True\n\
		break\n\
except:\n\
	${OUTPUT_RESULT_NAME}=False\n`;

export const CHECK_SIDECAR_EXISTS_CMD = `try:\n\
	sidecar\n\
	${OUTPUT_RESULT_NAME}=True\n\
except NameError:\n\
	${OUTPUT_RESULT_NAME}=False\n`;

export const REFRESH_GRAPHICS_CMD = `import __main__\n\
import json\n\
def graphic_methods():\n\
	out = {}\n\
	for type in vcs.graphicsmethodlist():\n\
		out[type] = vcs.listelements(type)\n\
	return out\n\
${OUTPUT_RESULT_NAME} = json.dumps(graphic_methods())\n`;

export const REFRESH_TEMPLATES_CMD = `import __main__\n\
import json\n\
${OUTPUT_RESULT_NAME} = json.dumps(vcs.listelements('template'))\n`;

export const CHECK_MODULES_CMD = `import types\n\
import json\n\
${safe("required")} = ${REQUIRED_MODULES}\n\
def imports():\n\
	for ${safe("name")}, val in globals().items():\n\
		if isinstance(val, types.ModuleType):\n\
			yield val.__name__\n\
${safe("found")} = list(imports())\n\
${OUTPUT_RESULT_NAME} = json.dumps(list(set(${safe("required")})-set(${safe(
  "found"
)})))\n`;

export const LIST_CANVASES_CMD = `import __main__\n\
import json\n\
def canvases():\n\
	out = []\n\
	for nm, obj in __main__.__dict__.items():\n\
		if isinstance(obj, vcs.Canvas.Canvas):\n\
			out+=[nm]\n\
	return out\n\
${OUTPUT_RESULT_NAME} = json.dumps(canvases())\n`;

const AXIS_INFO_CODE = `\n\
	${safe("first")} = float(${safe("axis")}[:].min())\n\
	${safe("last")} = float(${safe("axis")}[:].max())\n\
	if len(${safe("axis")}) < ${MAX_DIM_LENGTH}:\n\
		${safe("axis_data")} = ${safe("axis")}[:].tolist()\n\
	else:\n\
		${safe("axis_data")} = vcs.utils.mkscale(${safe("first")},${safe(
  "last"
)},${MAX_DIM_LENGTH})\n\
	# Get a displayable name for the variable\n\
	if hasattr(${safe("axis")}, 'id'):\n\
		${safe("name")} = ${safe("axis")}.id\n\
	else:\n\
		${safe("name")} = ${safe("aname")}\n\
	if hasattr(${safe("axis")}, 'units'):\n\
		${safe("units")} = ${safe("axis")}.units\n\
	else:\n\
		${safe("units")} = 'Unknown'\n\
	${safe("outAxes")}[${safe("aname")}] = {\n\
		'name': ${safe("name")},\n\
		'shape': ${safe("axis")}.shape,\n\
		'units': ${safe("units")},\n\
		'modulo': ${safe("axis")}.getModulo(),\n\
		'moduloCycle': ${safe("axis")}.getModuloCycle(),\n\
		'data': ${safe("axis_data")},\n\
		'first': ${safe("first")},\n\
		'last': ${safe("last")},\n\
		'isTime': ${safe("axis")}.isTime()\n\
	}\n`;

const VAR_INFO_CODE = `# Get a displayable name for the variable\n\
	if hasattr(${safe("var")}, 'long_name'):\n\
		${safe("name")} = ${safe("var")}.long_name\n\
	elif hasattr(${safe("var")}, 'title'):\n\
		${safe("name")} = ${safe("var")}.title\n\
	elif hasattr(${safe("var")}, 'id'):\n\
		${safe("name")} = ${safe("var")}.id\n\
	else:\n\
		${safe("name")} = ${safe("vname")}\n\
	if hasattr(${safe("var")}, 'units'):\n\
		${safe("units")} = ${safe("var")}.units\n\
	else:\n\
		${safe("units")} = 'Unknown'\n\
	${safe("axisList")} = []\n\
	for ${safe("axis")} in ${safe("var")}.getAxisList():\n\
		${safe("axisList")}.append(${safe("axis")}.id)\n\
	${safe("lonLat")} = None\n\
	if ${safe("var")}.getLongitude() and ${safe("var")}.getLatitude() and \
		not isinstance(${safe("var")}.getGrid(), cdms2.grid.AbstractRectGrid):\n\
		# for curvilinear and generic grids\n\
		# 1. getAxisList() returns the axes and\n\
		# 2. getLongitude() and getLatitude() return the lon,lat variables\n\
		lonName = ${safe("var")}.getLongitude().id\n\
		latName = ${safe("var")}.getLatitude().id\n\
		${safe("lonLat")} = [lonName, latName]\n\
		# add min/max for longitude/latitude\n\
		if (lonName not in ${safe("outVars")}):\n\
			${safe("outVars")}[lonName] = {}\n\
		lonData =${safe("var")}.getLongitude()[:]\n\
		${safe("outVars")}[lonName]['bounds'] = \
		[float(numpy.amin(lonData)), float(numpy.amax(lonData))]\n\
		if (latName not in ${safe("outVars")}):\n\
			${safe("outVars")}[latName] = {}\n\
		latData =${safe("var")}.getLatitude()[:]\n\
		${safe("outVars")}[latName]['bounds'] = \
		[float(numpy.amin(latData)), float(numpy.amax(latData))]\n\
	if (isinstance(${safe("var")}.getGrid(), cdms2.grid.AbstractRectGrid)):\n\
		gridType = 'rectilinear'\n\
	elif (isinstance(${safe("var")}.getGrid(), cdms2.hgrid.AbstractCurveGrid)):\n\
		gridType = 'curvilinear'\n\
	elif (isinstance(${safe(
    "var"
  )}.getGrid(), cdms2.gengrid.AbstractGenericGrid)):\n\
		gridType = 'generic'\n\
	else:\n\
		gridType = None\n\
	if (${safe("vname")} not in ${safe("outVars")}):\n\
		${safe("outVars")}[${safe("vname")}] = {}\n\
	${safe("outVars")}[${safe("vname")}]['name'] = ${safe("name")}\n\
	${safe("outVars")}[${safe("vname")}]['pythonID'] = id(${safe("var")})\n\
	${safe("outVars")}[${safe("vname")}]['shape'] =${safe("var")}.shape\n\
	${safe("outVars")}[${safe("vname")}]['units'] = ${safe("units")}\n\
	${safe("outVars")}[${safe("vname")}]['axisList'] = ${safe("axisList")}\n\
	${safe("outVars")}[${safe("vname")}]['lonLat'] = ${safe("lonLat")}\n\
	${safe("outVars")}[${safe("vname")}]['gridType'] = gridType\n\
	if ('bounds' not in ${safe("outVars")}[${safe("vname")}]):\n\
		${safe("outVars")}[${safe("vname")}]['bounds'] = None\n`;

export const REFRESH_VAR_CMD = `import __main__\n\
import json\n\
import cdms2\n\
import numpy\n\
def variables():\n\
	out = []\n\
	for nm, obj in __main__.__dict__.items():\n\
		if isinstance(obj, cdms2.MV2.TransientVariable):\n\
			out+=[nm]\n\
	return out\n\
${safe("vars")} = variables()\n\
${safe("outVars")} = {}\n\
for ${safe("vname")} in ${safe("vars")}:\n\
	${safe("var")} = __main__.__dict__[${safe("vname")}]\n\
	${VAR_INFO_CODE}\
${OUTPUT_RESULT_NAME} = json.dumps(${safe("outVars")})\n\
${safe("var")} = None`;

// FUNCTIONS THAT GENERATE PYTHON COMMANDS
export function checkCDMS2FileOpens(filename: string): string {
  const command = `import cdms2\n\
try:\n\
	file=cdms2.open("${filename}")\n\
	file.close()\n\
	${OUTPUT_RESULT_NAME} = True\n\
except:\n\
	${OUTPUT_RESULT_NAME} = False`;
  return command;
}

export function checkForExportedFileCommand(filename: string): string {
  return `import os\n\
import time\n\
def check_for_exported_file():\n\
	exported_file_path = os.path.join(os.getcwd(), '${filename}')\n\
	counter = 0\n\
	while not os.path.exists(exported_file_path):\n\
		time.sleep(1)\n\
		counter +=1\n\
		if counter == 15:\n\
			return False\n\
	return True\n\
${OUTPUT_RESULT_NAME}=check_for_exported_file()\n`;
}

export function getFileVarsCommand(relativePath: string): string {
  return `import json\n\
import cdms2\n\
import vcs\n\
import numpy\n\
${safe("reader")} = cdms2.open('${relativePath}')\n\
${safe("outVars")} = {}\n\
for ${safe("vname")} in ${safe("reader")}.variables:\n\
	${safe("var")} = ${safe("reader")}.variables[${safe("vname")}]\n\
	${VAR_INFO_CODE}\
${safe("outAxes")} = {}\n\
for ${safe("aname")} in ${safe("reader")}.axes:\n\
	${safe("axis")} = ${safe("reader")}.axes[${safe("aname")}]\n\
	${AXIS_INFO_CODE}\
${safe("reader")}.close()\n\
${OUTPUT_RESULT_NAME} = json.dumps({\n\
	'vars': ${safe("outVars")},\n\
	'axes': ${safe("outAxes")}\n\
})\n\
${safe("var")} = None\n`;
}

export function getAxisInfoFromFileCommand(relativePath: string): string {
  return `import json\n\
import cdms2\n\
import vcs\n\
${safe("reader")} = cdms2.open('${relativePath}')\n\
${safe("outAxes")} = {}\n\
for ${safe("aname")} in ${safe("reader")}.axes:\n\
	${safe("axis")} = ${safe("reader")}.axes[${safe("aname")}]\n\
	${AXIS_INFO_CODE}\
${safe("reader")}.close()\n\
${OUTPUT_RESULT_NAME} = json.dumps(${safe("outAxes")})\n`;
}

export function getAxisInfoFromVariableCommand(varName: string): string {
  return `import json\n\
import cdms2\n\
import vcs\n\
${safe("outAxes")} = {}\n\
${safe("names")} = ${varName}.getAxisIds()\n\
for idx in ${varName}.getAxisListIndex():\n\
	${safe("aname")} = ${safe("names")}[idx]\n\
	${safe("axis")} = ${varName}.getAxis(idx)\n\
	${AXIS_INFO_CODE}\
${OUTPUT_RESULT_NAME} = json.dumps(${safe("outAxes")})\n`;
}

export function getSidecarDisplayCommand(
  displayMode: DISPLAY_MODE,
  sidecarReady: boolean,
  sidecarTitle: string
): string {
  if (displayMode === DISPLAY_MODE.Notebook) {
    return `canvas._display_target = 'off'\n`;
  }

  if (sidecarReady) {
    return `canvas._display_target = sidecar\n`;
  }

  return `try:\n\
	#Set display to sidecar\n\
	canvas._display_target = sidecar\n\
except NameError:\n\
	#Sidecar was undefined, create new sidecar for plot display\n\
	from sidecar import Sidecar\n\
	sidecar = Sidecar(title='${sidecarTitle}')\n\
	canvas._display_target = sidecar\n`;
}
