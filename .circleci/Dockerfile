FROM circleci/node:stretch-browsers
ARG workdir="/tmp/jp-vcdat"
ARG cdat_channels="-c cdat/label/v82 -c cdat/label/nightly"
RUN mkdir -p ${workdir}
RUN wget https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ${workdir}/miniconda3.sh
RUN /bin/bash ${workdir}/miniconda3.sh -b -p ${workdir}/miniconda
ENV PATH=${workdir}/miniconda/bin:${PATH}
# 07/01/2019 -- commenting out the conda update,
# with conda update, I am getting a Permission denied when doing conda create command below.
# RUN conda update --all -y -n base
RUN cd ${workdir}
RUN conda create -y -n jupyter-vcdat ${cdat_channels} -c conda-forge nodejs "python>3" vcs jupyterlab pip nb_conda nb_conda_kernels plumbum jupyterhub libnetcdf=4.6.2 testsrunner cdat_info
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

# sudo docker build --build-arg workdir="/tmp/jp-vcdat"  --build-arg cdat_channel="cdat/label/v81" -t muryanto1/jupyter-vcdat.2.0.1 .
# docker push muryanto1/jupyter-vcdat.2.0.1:latest
