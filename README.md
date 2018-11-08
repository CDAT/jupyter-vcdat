# jupyter-react-ext

Learning to make extensions for JupyterLab and incorporating React.


## Prerequisites

* JupyterLab

## Installation

For a development install:

```bash

    #Create the environment
    conda create -n jupyter-vcdat -c cdat/label/nightly -c conda-forge -c cdat -c anaconda nodejs "python>3" vcs jupyterlab pip nb_conda
    source activate jupyter-vcdat

    # Go to vcs repo to update vcs code
    git clone https://github.com/CDAT/vcs.git
    cd vcs
    git checkout boxfill_widgets_jupyter
    python setup.py install

    #install the extension
    cd ..
    git clone https://github.com/CDAT/jupyter-vcdat.git
    cd jupyter-vcdat
    python setup.py install
    jupyter labextension install .
    jupyter serverextension enable --py vcs_backend

    #To run, got to jupyter-vcdat repo
    jupyter lab

```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

## Possible issues:

```bash
    #IF YOU GET FFMPEG IMPORT ERROR DO COMMAND:
    conda install -c conda-forge "ffmpeg>4"
```
