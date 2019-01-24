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

const REQUIRED_MODULES = "'lazy_import','cdms2','vcs'";

const CHECK_MODULES_CMD = `import sys\n\
all_modules = [${REQUIRED_MODULES}]\n\
output = []\n\
for module in all_modules:\n\
	if module not in sys.modules:\n\
		output.append(module)\n\
output`;

const BASE_URL = "/vcs";

const READY_KEY = "vcdat_ready";
const FILE_PATH_KEY = "vcdat_file_path";

export {
  GET_VARS_CMD,
  REFRESH_VARS_CMD,
  CHECK_MODULES_CMD,
  REQUIRED_MODULES,
  BASE_URL,
  READY_KEY,
  FILE_PATH_KEY
};
