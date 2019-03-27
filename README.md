# jupyter-react-ext

A Jupyter Lab extension that integrates vCDAT features directly in a notebook.

## Prerequisites

- JupyterLab

## Installation

To install on your local computer or local network, clone the jupyter-vcdat github repo:

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

    # For all users, activate the jupyter-vcdat environment and launch a JupyterLab instance
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
