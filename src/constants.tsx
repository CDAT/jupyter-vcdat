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
print("{}|{}|{})".format(variables(),templates(),graphic_methods()))';

const CHECK_MODULES_CMD =
  'import sys\n\
all_modules = ["lazy_import","vcs","cdms2"]\n\
missed_modules = []\n\
for module in all_modules:\n\
	if module not in sys.modules:\n\
		missed_modules.append(module)\n\
missed_modules';

const REQUIRED_MODULES = ["cdms2", "vcs"];

const BASE_URL = "/vcs";

export { GET_VARS_CMD, CHECK_MODULES_CMD, REQUIRED_MODULES, BASE_URL };
