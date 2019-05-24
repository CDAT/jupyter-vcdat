#!/usr/bin/env bash

# References
# http://kvz.io/blog/2013/11/21/bash-best-practices/
# http://jvns.ca/blog/2017/03/26/bash-quirks/

# default logfile name
filename="jupyter-vcdat_logfile.txt"
# NOT verbose by default
verbose=0

function usage() {
  cat << EOF
usage: Install vcdat jupyter-lab extension

optional arguments:
  -h, --help            show this help message and exit
  -f FILENAME, --filename FILENAME
                        name of file where to log output
  -v VERBOSE
                        Also prints output to screen
EOF
exit 0
}
# Figure out command line arguments: http://linuxcommand.org/lc3_wss0120.php
while [ "$1" != "" ]; do
    case $1 in
        -f | --file )           shift
                                filename=$1
                                ;;
        -v | --verbose )        verbose=1
                                ;;
        -h | --help )           usage
                                ;;
        * )                     usage
                                exit 1
    esac
    shift
done

pwd=`pwd`
echo "XXX pwd: ${pwd}"
ls=`ls`
echo "XXX ls: ${ls}"

echo "Installing jupyter-vcdat extension"
echo "Output will be redirected to $filename (you can control the filename with -f option)"
# Redirect to logfile and possibly screen if verbose
if [ $verbose == 1 ]; then
  # Redirect stdout ( > ) into a named pipe ( >() ) running "tee"
  exec > >(tee -i $filename)

else
  echo "Going into quiet mode, suppressing output"
  echo "For verbose mode run with -v option"
  # https://stackoverflow.com/questions/637827/redirect-stderr-and-stdout-in-bash
  # Close STDOUT file descriptor
  exec 1<&-
  # Close STDERR FD
  exec 2<&-

  # Open STDOUT as $LOG_FILE file for read and write.
  exec 1<>$filename
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
if [ ${CONDA_DEFAULT_ENV:-"NA"} != "jupyter-vcdat" ]; then
  echo "XXX SHOULD NOT BE HERE...inside if"
  echo "CONDA_DEFAULT_ENV: ${CONDA_DEFAULT_ENV}"

  $CONDA_EXE update --all -y -n base
  $CONDA_EXE create -y -n jupyter-vcdat -c cdat/label/v81 -c conda-forge nodejs "python>3" vcs jupyterlab pip nb_conda nb_conda_kernels plumbum jupyterhub libnetcdf=4.6.2
  CONDA_BASE=$(conda info --base)
  source $CONDA_BASE/etc/profile.d/conda.sh
  conda activate jupyter-vcdat

  # Install sidecar
  python -m pip install sidecar || pip install sidecar

  jupyter labextension install @jupyter-widgets/jupyterlab-manager
  jupyter labextension install @jupyter-widgets/jupyterlab-sidecar

  # Jupyterhub extension
  jupyter labextension install @jupyterlab/hub-extension
fi

# We need to allow pipe to break in case we are not in a git repo directory
set +o pipefail
REMOTE=$(git config --get remote.origin.url)
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
