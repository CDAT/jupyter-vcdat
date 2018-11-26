# jupyter-react-ext

Learning to make extensions for JupyterLab and incorporating React.


## Prerequisites

* JupyterLab

## Installation

For a development install:

```bash

    #Create the environment
    conda create -n jupyter-vcdat -c cdat/label/nightly -c conda-forge -c cdat -c anaconda nodejs "python>3" vcs jupyterlab pip nb_conda nb_conda_kernels
    source activate jupyter-vcdat

    # Install sidecar
    pip install sidecar
    jupyter labextension install @jupyter-widgets/jupyterlab-manager
    jupyter labextension install @jupyter-widgets/jupyterlab-sidecar

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

    #To run, got to jupyter-vcdat repo
    jupyter lab

```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

## Possible issues:

If you get an FFMPEG import error, run the following command:
```bash
    conda install -c conda-forge "ffmpeg>4"
```
