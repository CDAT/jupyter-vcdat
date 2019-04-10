# jupyter-react-ext

A Jupyter Lab extension that integrates vCDAT features directly in a notebook.

## Prerequisites

- JupyterLab
- Installation of conda via Anaconda or Miniconda conda >=4.6.11 (the script
  will try to update your base installation anyway)

## Installation

If you didn't let Anaconda or Miniconda prepend the Anaconda<2 or 3> install location to PATH, make sure conda is in your PATH (for more information see the Anaconda Documentation). Assuming Ananconda is installed in ${HOME}/anaconda:
* export PATH=${HOME}/anaconda/bin:${PATH} # for [ba]sh
* setenv PATH ${HOME}/anaconda/bin:${PATH} # for [t]csh

Next, clone the jupyter-vcdat github repo:

```
git clone https://github.com/CDAT/jupyter-vcdat.git
```

Change into the directory containing the repo and type in the following commands:

```bash

    #Create the environment
    ./install_script.sh

    # The following two lines of code install tslint if developers want to use it (optional):
      # For VSCode:
       code --install-extension tslint

      # For Atom:
      apm install linter-tslint

    # For all users, activate the jupyter-vcdat environment and launch the JupyterLab interface
    conda activate jupyter-vcdat
    jupyter lab

```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

## Sample data

To download sample data, enter the code below within a Jupyter notebook cell and run the cell:

```
import vcs
import cdms2
import cdat_info
import pkg_resources
vcs_egg_path = pkg_resources.resource_filename(pkg_resources.Requirement.parse("vcs"), "share/vcs")
path = vcs_egg_path+'/sample_files.txt'
cdat_info.download_sample_data_files(path,"sample_data")
```
