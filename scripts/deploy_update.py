# import glob
import os
# import pathlib
import subprocess
from string import Template

# base conda channels (always added)
BASE_CHANNELS = "-c conda-forge"

# dev conda channels (for developer deployment)
#  !!(change to '-c cdat/label/nightly' when nightly is ready)
DEV_CHANNELS = "-c cdat/label/v82"

# user conda channels (for stable deployment)
USER_CHANNELS = "-c cdat/label/v82"

# extra channels used for extra packages ( not used by default )
EXTRA_CHANNELS = "-c pcmdi/label/nightly"

# base packages (always added)
BASE_CONDA_PKGS = "pip vcs cdms2 tqdm nodejs 'python=3.7' "
BASE_CONDA_PKGS += "'jupyterlab=1.2.1' jupyterhub ipywidgets 'numpy=1.17'"

# extra packages ( Not included by default )
EXTRA_PACKAGES = "vcsaddons thermo cmor eofs windspharm autopep8 mesalib "
EXTRA_PACKAGES += "scikit-learn wk nb_conda nb_conda_kernels plumbum scipy"

# dev and test packages (for developer deployment)
DEV_CONDA_PKGS = "testsrunner cdat_info"

# base pip packages (always installed)
BASE_PIP_PKGS = ["sidecar"]

# dev pip packages (required only for developer deployment)
DEV_PIP_PKGS = ["selenium", "pyvirtualdisplay"]

# REQURIED JupyterLab extensions to install (not including Jupyter-VCDAT)
BASE_EXTENSIONS = [
    "@jupyter-widgets/jupyterlab-manager",
    "@jupyter-widgets/jupyterlab-sidecar",
    "jupyterlab-tutorial-extension",
    "@jupyterlab/hub-extension"
]

# EXTRA JupyterLab extensions (installed but not required)
EXTRA_EXTENSIONS = [
    "jupyterlab-favorites"
]


def get_main_dir():
    output = subprocess.run(
        ["git rev-parse --show-toplevel"], capture_output=True, text=True, shell=True)
    return output.stdout.rstrip()


def create_pip_commands(packages, pre=""):
    c = ""
    for p in packages:
        c += "{}python -m pip install {} || pip install {}\n".format(pre, p, p)
    return c[:-1]  # The command string


def create_extension_commands(extensions, pre=""):
    c = ""
    for e in extensions:
        c += "{}jupyter labextension install {}\n".format(pre, e)
    return c[:-1]  # The command string


def update_template(template_in, file_out, data):
    # Read installer template
    f = open(template_in, "r")
    if f.mode == 'r':
        template_content = f.read()
        f.close()
    else:
        return

    # Perform substitution
    template = Template(template_content)
    result = template.safe_substitute(data)
    f = open(file_out, "w+")
    f.write(result)
    f.close()


# Takes a template of the dockerfile and creates a new dockerfile with specified
# installation steps
def create_docker_script(template_in, docker_out):

    # Generate pip install commands
    _pip = create_pip_commands(BASE_PIP_PKGS, "RUN ")

    # Generate extension install commands
    EXTS = BASE_EXTENSIONS + EXTRA_EXTENSIONS
    install_ext = create_extension_commands(EXTS, "RUN ")

    CONDA_CHANNELS = BASE_CHANNELS + USER_CHANNELS
    # Combine all settings into dictonary for template to use
    data = {"_conda_channels": CONDA_CHANNELS, "_conda_pkgs": BASE_CONDA_PKGS,
            "_pip_install": _pip, "_install_extensions": install_ext}

    # Create install file
    update_template(template_in, docker_out, data)


# Takes a template of the installer script and creates a new install script with specified
# conda channels and packages.
def create_install_script(template_in, installer_out):

    # Generate pip install commands
    base_pip = create_pip_commands(BASE_PIP_PKGS)
    dev_pip = create_pip_commands(DEV_PIP_PKGS, "\t")

    # Generate extension install commands
    EXTS = BASE_EXTENSIONS + EXTRA_EXTENSIONS
    install_ext = create_extension_commands(EXTS)

    # Combine all settings into dictonary for template to use
    data = {"_base_channels": BASE_CHANNELS, "_dev_channels": DEV_CHANNELS,
            "_user_channels": USER_CHANNELS, "_base_conda_pkgs": BASE_CONDA_PKGS,
            "_dev_conda_pkgs": DEV_CONDA_PKGS, "_base_pip_install": base_pip,
            "_dev_pip_install": dev_pip, "_install_extensions": install_ext}

    # Create install file
    update_template(template_in, installer_out, data)
    # Set permissions of install to execute
    os.chmod(installer_out, 0o777)


def main():
    template_in = "{}/deploy/template_install".format(MAIN_DIR)
    file_out = "{}/install_script.sh".format(MAIN_DIR)
    create_install_script(template_in, file_out)
    template_in = "{}/deploy/template_docker".format(MAIN_DIR)
    file_out = "{}/deploy/Dockerfile".format(MAIN_DIR)
    create_docker_script(template_in, file_out)


if __name__ == '__main__':
    MAIN_DIR = get_main_dir()
    main()
