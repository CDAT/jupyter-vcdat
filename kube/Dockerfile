# This dockerfile will create a docker image for an official release
FROM aims2.llnl.gov/nimbus-basic:latest
# Get the latest image tag at:
# https://hub.docker.com/r/jasonb87/nimbus-basic

RUN conda config --set remote_read_timeout_secs 120 && conda install --force -y -c cdat/label/nightly -c cdat/label/v82 -c conda-forge -c pcmdi/label/nightly nodejs "python=3.7" vcs vcsaddons thermo wk eofs windspharm autopep8 scipy scikit-learn pip nb_conda nb_conda_kernels plumbum mesalib 'jupyterlab>1' jupyterhub cmor && conda clean -y --all && pip install lazy_import && pip install sidecar && rm -rf ~/.cache/pip

RUN jupyter labextension install @jupyter-widgets/jupyterlab-manager && jupyter labextension install jupyterlab-tutorial-extension && jupyter labextension install @jupyter-widgets/jupyterlab-sidecar && jupyter labextension install @jupyterlab/github && pip install jupyterlab_github && jupyter serverextension enable --sys-prefix jupyterlab_github && pip install nbgitpuller && jupyter serverextension enable --py nbgitpuller --sys-prefix && jupyter labextension install @jupyterlab/hub-extension && rm -rf node_modules && rm -rf ~/.cache/pip

# Get the setup image
ENV CDAT_ANONYMOUS_LOG false
# extension
# Our extension needs to be built from npm repo otherwise jupyter-lab
# tries to write into image and shifter does not let us do this.
RUN jupyter labextension install jupyter-vcdat && conda update -c cdat/label/nightly -c conda-forge vcs cdms2 cdutil genutil libcdms
