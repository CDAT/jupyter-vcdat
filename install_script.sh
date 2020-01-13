#!/usr/bin/env bash

# References
# http://kvz.io/blog/2013/11/21/bash-best-practices/
# http://jvns.ca/blog/2017/03/26/bash-quirks/

# default logfile name
FILENAME="jupyter-vcdat_logfile.txt"
# NOT verbose by default
verbose=0

# default env name
REQUESTED_CONDA_ENV_NAME="jupyter-vcdat"


# conda channels
DEFAULT_CONDA_CHANNELS="-c cdat/label/v82 -c conda-forge"

# extra conda channels
CUSTOM_CONDA_CHANNELS=""

function usage() {
  cat << EOF
usage: Install vcdat jupyter-lab extension

optional arguments:
  -h, --help            show this help message and exit
  -f FILENAME, --FILENAME FILENAME
                        name of file where to log output
  -v VERBOSE
                        Also prints output to screen
  -n CONDA_ENV_NAME, --name CONDA_ENV_NAME
                        Name of the conda environment to install in (will create if not existing)
  -c CONDA_EXTRA_CHANNEL, --channel CONDA_EXTRA_CHANNEL
                        extra conda channels to use (use an extra -c if more than one)
                        example:
                        -c "cdat/label/nightly"
                        -c "cdat/label/nightly" -c "cdat/label/v82"
EOF
exit 0
}
# Figure out command line arguments: http://linuxcommand.org/lc3_wss0120.php
while [ "$1" != "" ]; do
    case $1 in
        -f | --file )           shift
                                FILENAME=$1
                                ;;
        -v | --verbose )        verbose=1
                                ;;
        -n | --name ) shift
                                REQUESTED_CONDA_ENV_NAME=$1
                                ;;
        -c | --channel ) shift
                                CUSTOM_CONDA_CHANNELS=${CUSTOM_CONDA_CHANNELS}" -c "$1
                                ;;
        -h | --help )           usage
                                ;;
        * )                     usage
                                exit 1
    esac
    shift
done

echo "Installing jupyter-vcdat extension in conda env: '${REQUESTED_CONDA_ENV_NAME}' (you can change this via -c option)"
echo "Using following conda channels: '${CUSTOM_CONDA_CHANNELS} ${DEFAULT_CONDA_CHANNELS}'"
echo "Output will be redirected to: '$FILENAME' (you can control the FILENAME with -f option)"
# Redirect to logfile and possibly screen if verbose
if [ $verbose == 1 ]; then
  # Redirect stdout ( > ) into a named pipe ( >() ) running "tee"
  exec > >(tee -i $FILENAME)

else
  echo "Going into quiet mode, suppressing output"
  echo "For verbose mode run with -v option"
  # https://stackoverflow.com/questions/637827/redirect-stderr-and-stdout-in-bash
  # Close STDOUT file descriptor
  exec 1<&-
  # Close STDERR FD
  exec 2<&-

  # Open STDOUT as $LOG_FILE file for read and write.
  exec 1<>$FILENAME
fi
# Without this, only stdout would be captured - i.e. your
# log file would not contain any error messages.
# SEE (and upvote) the answer by Adam Spiers, which keeps STDERR
# as a separate stream - I did not want to steal from him by simply
# adding his answer to mine.
exec 2>&1

  


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
if [ ${CONDA_DEFAULT_ENV:-"NA"} != ${REQUESTED_CONDA_ENV_NAME} ]; then
    echo "Current conda does not match requested conda: ${CONDA_DEFAULT_ENV:-'NA'} vs ${REQUESTED_CONDA_ENV_NAME}"
    envs=$(${CONDA_EXE} env list | cut -d ' ' -f1)
    found=0
    for a_env in $envs
    do
        if [ $a_env == ${REQUESTED_CONDA_ENV_NAME} ]; then
            found=1
        fi
    done
    if [ $found == 1 ]; then
        echo "ACTIVATING existing env: ${REQUESTED_CONDA_ENV_NAME}"
        source activate ${REQUESTED_CONDA_ENV_NAME}
    else
        echo "The requested env ${REQUESTED_CONDA_ENV_NAME} does not seem to exist we will create it."
    fi
fi

if [ ${CONDA_DEFAULT_ENV:-"NA"} != ${REQUESTED_CONDA_ENV_NAME} ]; then
  echo "Creating conda env: ${REQUESTED_CONDA_ENV_NAME}"
  $CONDA_EXE update --all -y -n base
  $CONDA_EXE create -y -n ${REQUESTED_CONDA_ENV_NAME} ${CUSTOM_CONDA_CHANNELS} ${DEFAULT_CONDA_CHANNELS} nodejs "python>3" vcs "jupyterlab>=1" pip nb_conda nb_conda_kernels plumbum jupyterhub "libnetcdf=4.6.2"
  CONDA_BASE=$(conda info --base)
  source $CONDA_BASE/etc/profile.d/conda.sh
  conda activate ${REQUESTED_CONDA_ENV_NAME}

  # Install sidecar
  python -m pip install sidecar || pip install sidecar

  jupyter labextension install @jupyter-widgets/jupyterlab-manager
  jupyter labextension install @jupyter-widgets/jupyterlab-sidecar

  # Install tutorial extension
  jupyter labextension install jupyterlab-tutorial-extension

  # Jupyterhub extension
  jupyter labextension install @jupyterlab/hub-extension

  # Favorites extension from LBNL
  jupyter labextension install jupyterlab-favorites
fi

# We need to allow pipe to break in case we are not in a git repo directory
set +o pipefail
REMOTE=$(git config --get remote.origin.url) || REMOTE="NO"
echo "REMOTE: $REMOTE"
PROTOCOL_SEP=${REMOTE:3:1}
echo "PROTOCOL SEPARATOR: $PROTOCOL_SEP"
if [[ $PROTOCOL_SEP == "@" ]]; then
    NDELIM=2
else
    NDELIM=5
fi
echo "NDELIM: $NDELIM"
REPO=$(echo $REMOTE | cut -d '/' -f $NDELIM) || REPO="NO"
echo "REPO:$REPO"
set -o pipefail

if [[ $REPO != "jupyter-vcdat" && $REPO != "jupyter-vcdat.git" ]]; then
  git clone git://github.com/CDAT/jupyter-vcdat.git
  cd jupyter-vcdat
fi

npm install
jupyter lab build
jupyter-labextension install .
