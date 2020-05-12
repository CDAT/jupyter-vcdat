#!/bin/sh
conda list
pip install sidecar
jupyter labextension install @jupyter-widgets/jupyterlab-manager --no-build
jupyter labextension install @jupyter-widgets/jupyterlab-sidecar --no-build
jupyter labextension install jupyterlab-tutorial-extension --no-build
jupyter labextension install @jupyterlab/hub-extension
npm install
jupyter lab build
