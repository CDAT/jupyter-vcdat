#!/usr/bin/env bash

# References
# http://kvz.io/blog/2013/11/21/bash-best-practices/
# http://jvns.ca/blog/2017/03/26/bash-quirks/

# exit when a command fails
set -o errexit

# exit if any pipe commands fail
set -o pipefail

set -E
set -o functrace
function handle_error {
    local retval=$?
    local line=${last_lineno:-$1}
    echo "Failed at $line: $BASH_COMMAND"
    echo "Trace: " "$@"
    echo "return code: " "$?"
    exit $retval
 }
trap 'handle_error $LINENO ${BASH_LINENO[@]}' ERR

CONDA_EXE="$(which conda)"
$CONDA_EXE update --all -y -n base
$CONDA_EXE create -y -n jupyter-vcdat -c cdat/label/v81 -c conda-forge nodejs "python>3" vcs jupyterlab pip nb_conda nb_conda_kernels plumbum jupyterhub
CONDA_BASE=$(conda info --base)
source $CONDA_BASE/etc/profile.d/conda.sh
conda activate jupyter-vcdat

# Install sidecar
<<<<<<< HEAD
python -m pip install sidecar || pip install sidecar

=======
python -m pip install sidecar
>>>>>>> 2e5fb6a0ea5df681eec5961f38ff807e68541a13
jupyter labextension install @jupyter-widgets/jupyterlab-manager
jupyter labextension install @jupyter-widgets/jupyterlab-sidecar

# Jupyterhub extension
jupyter labextension install @jupyterlab/hub-extension

if [[ ! -d "../jupyter-vcdat" ]]; then
  git clone https://github.com/CDAT/jupyter-vcdat.git
  cd jupyter-vcdat
fi

npm install
jupyter lab build
jupyter-labextension install .
