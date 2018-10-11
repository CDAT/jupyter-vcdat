# jupyter-react-ext

Learning to make extensions for JupyterLab and incorporating React.


## Prerequisites

* JupyterLab

## Installation

```bash
    #Install
    jupyter labextension install jupyter-vcdat

    #To run
    jupyter lab
```

## Development Install

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash

    #Create the environment
    conda create -n jupyter-vcdat -c cdat/label/nightly -c conda-forge -c cdat -c anaconda libcurl ipython nodejs vcs jupyterlab jupyter flake8 autopep8 pip nb_conda jupyterhub ipywidgets python=3
    source activate jupyter-vcdat

    # Go to vcs repo
    git clone https://github.com/CDAT/vcs.git
    cd vcs
    git checkout boxfill_widgets_jupyter
    python setup.py install --old-and-unmanageable

    # Install sidecar
    pip install sidecar
    jupyter labextension install @jupyter-widgets/jupyterlab-manager
    jupyter labextension install @jupyter-widgets/jupyterlab-sidecar

    #install the react-tutorial extension
    cd ..
    git clone https://github.com/CDAT/jupyter-vcdat.git
    cd jupyter-vcdat
    git checkout vcdat2.0
    npm install
    jupyter labextension install .

    #IF YOU GET FFMPEG IMPORT ERROR DO COMMAND:
    conda install -c conda-forge "ffmpeg>4"

    #To run, got to jupyter-vcdat repo
    jupyter lab

```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```
