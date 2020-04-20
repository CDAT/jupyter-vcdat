#!/bin/sh
conda list
pip install https://files.pythonhosted.org/packages/e9/29/1a8ba5daffc63f883f23fc2012a5beeea320fe57e8c681ab4b11de30da7a/sidecar-0.3.0-py2.py3-none-any.whl
jupyter labextension install @jupyter-widgets/jupyterlab-manager --no-build
jupyter labextension install @jupyter-widgets/jupyterlab-sidecar --no-build
jupyter labextension install jupyterlab-tutorial-extension --no-build
jupyter labextension install @jupyterlab/hub-extension
npm install
jupyter lab build
