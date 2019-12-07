# This dockerfile will create a docker image for development image
FROM aims2.llnl.gov/nimbus-basic:latest

# Add local npm package for installing into image
ADD local_package local_package

ARG conda_channels="-c cdat/label/nightly -c cdat/label/v82 -c conda-forge -c pcmdi/label/nightly"
ARG conda_packages="nodejs 'python=3.7' 'libnetcdf=4.6.2' vcs pip nb_conda nb_conda_kernels plumbum mesalib 'jupyterlab=1.2' jupyterhub"
ARG added_packages="vcsaddons thermo wk eofs windspharm autopep8 scipy scikit-learn cmor"
RUN conda config --set remote_read_timeout_secs 120
RUN conda install -y ${conda_channels} ${conda_packages} ${added_packages}
RUN conda clean -y --all
RUN pip install lazy_import 
RUN pip install sidecar 
RUN rm -rf ~/.cache/pip

RUN jupyter labextension install @jupyter-widgets/jupyterlab-manager 
RUN jupyter labextension install jupyterlab-tutorial-extension 
RUN jupyter labextension install @jupyter-widgets/jupyterlab-sidecar
RUN jupyter labextension install @jupyterlab/github
RUN pip install jupyterlab_github
RUN jupyter serverextension enable --sys-prefix jupyterlab_github
RUN pip install nbgitpuller
RUN jupyter serverextension enable --py nbgitpuller --sys-prefix
RUN jupyter labextension install @jupyterlab/hub-extension
RUN rm -rf node_modules
RUN rm -rf ~/.cache/pip

# Creates a docker image from local built npm package
RUN jupyter labextension install local_package
