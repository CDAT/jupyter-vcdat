#!/usr/bin/env python
from subprocess import Popen, PIPE
import shlex
from setuptools import setup, find_packages

def runme(cmd):
    print("Running: ",cmd)
    p = Popen(shlex.split(cmd), stdout=PIPE, stderr=PIPE)
    o,e = p.communicate()
    print(o)
    return o,e


# runme("pip install sidecar")
runme("npm install")
runme("npm run build")
runme("jupyter labextension install .")
runme("jupyter serverextension enable --py vcs_backend")

Version = "2.0"
p = Popen(
    ("git",
     "describe",
     "--tags"),
    stdin=PIPE,
    stdout=PIPE,
    stderr=PIPE)
try:
    descr = p.stdout.readlines()[0].strip().decode("utf-8")
    Version = "-".join(descr.split("-")[:-2])
    if Version == "":
        Version = descr
except:
    descr = Version

setup(name="jupyter_vcdat",
      version=descr,
      description="Jupyter lab extension to cdat",
      url="http://github.com/cdat/jupyter-vcdat",
      packages=find_packages(),
      scripts= ["scripts/vcdat"],
      zip_safe=True,
      #data_files=[('share/vcs', ('Share/wmo_symbols.json',))]
)