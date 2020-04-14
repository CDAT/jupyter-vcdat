# This dockerfile will create a docker image for an official release
FROM nimbus16.llnl.gov:8443/default/nimbus-jupyterlab:latest

# Install Conda packages
ARG conda_channels="-c conda-forge -c cdat/label/nightly"
ARG conda_packages="pip vcs cdms2 tqdm nodejs 'python=3.7' 'libnetcdf=4.7.3' 'jupyterlab=1.2' jupyterhub ipywidgets 'numpy=1.17'"
RUN conda config --set remote_read_timeout_secs 120
RUN conda config --set channel_priority strict
RUN conda install --force -y ${conda_channels} ${conda_packages}
RUN conda clean -y --all

# Install pip packages
RUN python -m pip install sidecar || pip install sidecar

# Install JupyterLab extensions
RUN jupyter labextension install @jupyter-widgets/jupyterlab-manager
RUN jupyter labextension install @jupyter-widgets/jupyterlab-sidecar
RUN jupyter labextension install jupyterlab-tutorial-extension
RUN jupyter labextension install @jupyterlab/hub-extension
RUN jupyter labextension install jupyterlab-favorites

# Our extension needs to be built from npm repo otherwise jupyter-lab
# tries to write into image and shifter does not let us do this.
RUN jupyter labextension install jupyter-vcdat@nightly
