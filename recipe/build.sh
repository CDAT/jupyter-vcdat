#!/bin/sh
conda list
https://files.pythonhosted.org/packages/55/a4/6c81cc08e5a307e692659fdc3a9a1a031d173a4c79d0539cbd20e357fa75/sidecar-0.4.0-py2.py3-none-any.whl
jupyter labextension install @jupyter-widgets/jupyterlab-manager --no-build
jupyter labextension install @jupyter-widgets/jupyterlab-sidecar --no-build
jupyter labextension install jupyterlab-tutorial-extension --no-build
jupyter labextension install @jupyterlab/hub-extension
npm install
jupyter lab build
jupyter labextension install jupyter-vcdat@nightly
