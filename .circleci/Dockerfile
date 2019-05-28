FROM circleci/node:jessie-browsers
ARG workdir="/tmp/jp-vcdat"
ARG cdat_channel="cdat/label/v81"
RUN mkdir -p ${workdir}
RUN wget https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ${workdir}/miniconda3.sh
RUN /bin/bash ${workdir}/miniconda3.sh -b -p ${workdir}/miniconda
ENV PATH=${workdir}/miniconda/bin:${PATH}
RUN conda update --all -y -n base
RUN conda create -y -n jupyter-vcdat -c ${cdat_channel} -c conda-forge nodejs "python>3" vcs jupyterlab pip nb_conda nb_conda_kernels plumbum jupyterhub libnetcdf=4.6.2 testsrunner cdat_info
RUN /bin/bash -c "source ${workdir}/miniconda/etc/profile.d/conda.sh; \
                  conda activate jupyter-vcdat; \
                  conda env list; \
                  python -m pip install sidecar || pip install sidecar; \
                  jupyter labextension install @jupyter-widgets/jupyterlab-manager; \
                  jupyter labextension install @jupyter-widgets/jupyterlab-sidecar; \
                  jupyter labextension install @jupyterlab/hub-extension; \
		  	    pip install selenium; \
			    	  pip install pyvirtualdisplay"
CMD ["/bin/bash"]

# sudo docker build --build-arg workdir="/tmp/jp-vcdat"  --build-arg cdat_channel="cdat/label/v81" -t muryanto1/jupyter-vcdat .
# docker push muryanto1/jupyter-vcdat:latest
