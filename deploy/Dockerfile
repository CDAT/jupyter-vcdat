# This dockerfile will create a docker image for an official release
FROM nimbus16.llnl.gov:8443/default/nimbus-jupyterlab:1.0.0

ARG npm_version="nightly"

# Install Conda packages
ARG conda_channels="-c cdat/label/v8.2.1 -c conda-forge"
ARG conda_packages="pip vcs tqdm nodejs 'python=3.7' jupyterlab jupyterhub ipywidgets numpy _linux_pkgs"
RUN conda config --set channel_priority strict
RUN conda install --force -y ${conda_channels} ${conda_packages}
RUN conda clean -y --all

# Install pip packages
RUN python -m pip install sidecar || pip install sidecar

# Install JupyterLab extensions
RUN jupyter labextension install @jupyter-widgets/jupyterlab-manager --no-build
RUN jupyter labextension install @jupyter-widgets/jupyterlab-sidecar --no-build
RUN jupyter labextension install jupyterlab-tutorial-extension --no-build
RUN jupyter labextension install @jupyterlab/hub-extension --no-build

# Our extension needs to be built from npm repo otherwise jupyter-lab
# tries to write into image and shifter does not let us do this.
RUN jupyter labextension install jupyter-vcdat@${npm_version}
