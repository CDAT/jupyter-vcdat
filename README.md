# jupyter-react-ext

Learning to make extensions for JupyterLab and incorporating React.


## Prerequisites

* JupyterLab

## Installation

For a development install:

```bash

    #Create the environment
    conda create -n jupyter-vcdat -c cdat/label/v81 -c conda-forge nodejs "python>3" vcs jupyterlab pip nb_conda nb_conda_kernels plumbum
    source activate jupyter-vcdat

    # Install lazy_import
    python -m pip install lazy_import
    # Install sidecar
    python -m pip install sidecar
    jupyter labextension install @jupyter-widgets/jupyterlab-manager
    jupyter labextension install @jupyter-widgets/jupyterlab-sidecar

    # Install the extension
    cd ..
    git clone https://github.com/CDAT/jupyter-vcdat.git
    cd jupyter-vcdat
    python setup.py install

    # To run, got to jupyter-vcdat repo
    npm install
    npm run build
    jupyter lab build
    jupyter-labextension install .
    jupyter lab

```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```
