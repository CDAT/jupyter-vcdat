python -m pip install lazy_import
# Install sidecar
python -m pip install sidecar
jupyter labextension install @jupyter-widgets/jupyterlab-manager
jupyter labextension install @jupyter-widgets/jupyterlab-sidecar
python setup.py
npm install
npm run build
jupyter lab build
jupyter-labextension install .

