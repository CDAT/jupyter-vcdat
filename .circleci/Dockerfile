FROM circleci/node:stretch-browsers
ARG cdat_channels="-c conda-forge -c cdat/label/v82"
ARG conda_packages="vcs nodejs 'python=3.7' jupyterlab jupyterhub pip nb_conda nb_conda_kernels plumbum"
ARG workdir="/tmp/jp-vcdat"
RUN mkdir -p ${workdir}
RUN wget https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ${workdir}/miniconda3.sh
RUN /bin/bash ${workdir}/miniconda3.sh -b -p ${workdir}/miniconda
ENV PATH=${workdir}/miniconda/bin:${PATH}
RUN conda --version
RUN conda update --all -y -n base
RUN conda --version
RUN ls -al /
RUN id
RUN conda config --set channel_priority strict
RUN conda create -y -n jupyter-vcdat ${cdat_channels} ${conda_packages}

RUN /bin/bash -c "source ${workdir}/miniconda/etc/profile.d/conda.sh; \
                  conda activate jupyter-vcdat; \
                  conda env list; \
                  python -m pip install sidecar || pip install sidecar; \
                  jupyter labextension install @jupyter-widgets/jupyterlab-manager; \
                  jupyter labextension install @jupyter-widgets/jupyterlab-sidecar; \
                  jupyter labextension install jupyterlab-tutorial-extension; \
                  jupyter labextension install @jupyterlab/hub-extension; \
   	              pip install selenium; \
		          pip install pyvirtualdisplay"

CMD ["/bin/bash"]
