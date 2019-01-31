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

const REFRESH_VARS_CMD =
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

export {
  REQUIRED_MODULES,
  BASE_URL,
  READY_KEY,
  FILE_PATH_KEY,
  IMPORT_CELL_KEY,
  VARIABLES_LOADED_KEY,
  GET_VARS_CMD,
  REFRESH_VARS_CMD,
  CHECK_MODULES_CMD,
  LIST_CANVASES_CMD
};
