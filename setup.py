#!/usr/bin/env python
from subprocess import Popen, PIPE
from setuptools import setup, find_packages
import logging
import os
from plumbum import local
from plumbum import TEE
from plumbum.commands import ProcessExecutionError

logger = logging.basicConfig(level=logging.DEBUG,
                             format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("setup")


def call_binary(binary_name, arguments=None, stderr_output=None):
    """Use plumbum to make a call to a CLI binary.  The arguments should be passed as a list of strings."""
    RETURN_CODE = 0
    STDOUT = 1
    STDERR = 2
    logger.debug("binary_name: %s", binary_name)
    logger.debug("arguments: %s", arguments)
    try:
        command = local[binary_name]
    except ProcessExecutionError:
        logger.error("Could not find %s executable", binary_name)
        raise

    for var in os.environ:
        local.env[var] = os.environ[var]

    if arguments is not None:
        output = command.__getitem__(arguments) & TEE
    else:
        output = command.run_tee()

    # Check for non-zero return code
    if output[RETURN_CODE] != 0:
        logger.error("Error occurred when executing %s %s", binary_name, " ".join(arguments))
        logger.error("STDERR: %s", output[STDERR])
        raise ProcessExecutionError
    else:
        return output[STDOUT]


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
      zip_safe=True,
      #data_files=[('share/vcs', ('Share/wmo_symbols.json',))]
)

call_binary("pip", ["install", "sidecar"])
call_binary("pip", ["install", "lazy_import"])
# call_binary("pip", ["install", "nbgitpuller"])
# call_binary("jupyter", ["serverextension", "enable", "--py", "nbgitpuller", "--sys-prefix"])
