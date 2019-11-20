# This dockerfile will create a docker image for an official release
FROM aims2.llnl.gov/nimbus-basic:latest

ARG cdat_channels="-c conda-forge -c cdat/label/v82 -c pcmdi/label/nightly"
ARG conda_packages="vcs nodejs 'python=3.7' jupyterlab jupyterhub pip nb_conda nb_conda_kernels plumbum"
ARG conda_additions="vcsaddons 'libnetcdf=4.6.2' mesalib cmor thermo wk eofs windspharm autopep8 scipy scikit-learn"
RUN conda config --set remote_read_timeout_secs 120 --set channel_priority strict
RUN conda install --force -y ${cdat_channels} ${conda_packages} ${conda_additions}
RUN conda clean -y --all && pip install lazy_import && pip install sidecar && rm -rf ~/.cache/pip

RUN jupyter labextension install @jupyter-widgets/jupyterlab-manager
RUN jupyter labextension install jupyterlab-tutorial-extension
RUN jupyter labextension install @jupyter-widgets/jupyterlab-sidecar
RUN jupyter labextension install @jupyterlab/github
RUN pip install jupyterlab_github
RUN jupyter serverextension enable --sys-prefix jupyterlab_github
RUN pip install nbgitpuller
RUN jupyter serverextension enable --py nbgitpuller --sys-prefix 
RUN jupyter labextension install @jupyterlab/hub-extension 
RUN rm -rf node_modules && rm -rf ~/.cache/pip

ENV CDAT_ANONYMOUS_LOG false

# Our extension needs to be built from npm repo otherwise jupyter-lab
# tries to write into image and shifter does not let us do this.
RUN jupyter labextension install jupyter-vcdat@nightly
RUN conda update -c conda-forge -c cdat/label/v82 vcs cdms2 cdutil genutil libcdms
