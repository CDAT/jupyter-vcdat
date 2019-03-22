# jupyter-react-ext

A Jupyter Lab extension that integrates vCDAT features directly in a notebook.

## Prerequisites

- JupyterLab

## Installation

For a development install:

```bash

    #Create the environment
    ./install_script.sh

    # Install tslint (optional)
      # For VSCode:
       code --install-extension tslint

      # For Atom:
      apm install linter-tslint

    conda activate jupyter-vcdat
    jupyter lab

```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

## Sample data

To download sample data, enter code below within a Jupyter notebook cell and run the cell:

```
  import pkg_resources
  vcs_egg_path = pkg_resources.resource_filename(pkg_resources.Requirement.parse("vcs"), "share/vcs")
  path = vcs_egg_path+'/sample_files.txt'
  cdat_info.download_sample_data_files(path,"sample_data")
```
