# import glob
import os
# import pathlib
import subprocess
from string import Template

# TEMPLATES LOCATION
TEMPLATES_DIR = "/scripts/deploy_templates"

# Docker base image
BASE_IMAGE = "nimbus16.llnl.gov:8443/default/nimbus-jupyterlab:latest"

# Docker selenium test images
TEST_CHROME_IMAGE = "selenium/node-chrome"
TEST_FIREFOX_IMAGE = "selenium/node-firefox"

# Tag used to publish docker image
VCDAT_IMAGE_TAG = "cdat/vcdat"

# Host requirements for conda package
HOST_REQUIREMENTS = ["jupyterlab", "nodejs", "pip", "python>=3.7"]

# Run requirements for conda package
RUN_REQUIREMENTS = ["cdms2", "ipywidgets", "jupyterhub", "'jupyterlab=1.2'", "nb_conda",
                    "libnetcdf=4.7.3", "nb_conda_kernels", "'python>=3.7'", "tqdm", "vcs"]

# base conda channels (always added)
BASE_CHANNELS = "-c conda-forge"

# dev conda channels (for developer deployment)
DEV_CHANNELS = "-c cdat/label/nightly"

# user conda channels (for stable deployment)
USER_CHANNELS = "-c cdat/label/nightly"

# channels used for conda upload (conda deployment)
UPLOAD_CHANNELS = "-c cdat/label/nightly -c conda-forge -c cdat"

# extra channels used for extra packages ( not used by default )
EXTRA_CHANNELS = "-c pcmdi/label/nightly"

# base packages (always added)
BASE_CONDA_PKGS = "pip vcs cdms2 tqdm nodejs 'python=3.7' 'libnetcdf=4.7.3'"
BASE_CONDA_PKGS += " 'jupyterlab=1.2' jupyterhub ipywidgets 'numpy=1.17'"

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


def create_extension_commands(extensions, pre="", post=""):
    c = ""
    for e in extensions:
        c += "{}jupyter labextension install {}{}\n".format(pre, e, post)
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


# Takes a template of the build.sh used by conda recipe with specified ext.
def create_build_script(template_in, script_out):
    # This was the sidecar package being used by build.sh
    # Should be updated if possible
    sidecar_pip = "https://files.pythonhosted.org/packages\
/e9/29/1a8ba5daffc63f883f23fc2012a5beeea320fe57e8c\
681ab4b11de30da7a/sidecar-0.3.0-py2.py3-none-any.whl"

    # Generate pip install commands
    pip = "pip install {}".format(sidecar_pip)

    # Generate extension install commands
    EXTS = BASE_EXTENSIONS + EXTRA_EXTENSIONS
    install_ext_no_build = create_extension_commands(
        EXTS[:-1], post=" --no-build")
    install_ext = create_extension_commands([EXTS[-1]])
    install_exts = "{}\n{}".format(install_ext_no_build, install_ext)

    data = {"_pip": pip, "_install_ext": install_exts}
    update_template(template_in, script_out, data)


# Takes a template of the circleci config and generates a config
def create_circle_config(template_in, config_out):

    # Combine all settings into dictonary for template to use
    data = {"_upload_channels": UPLOAD_CHANNELS, "_vcdat_tag": VCDAT_IMAGE_TAG,
            "_base_image": BASE_IMAGE, "_test_chrome_img": TEST_CHROME_IMAGE,
            "_test_firefox_img": TEST_FIREFOX_IMAGE}

    # Create install file
    update_template(template_in, config_out, data)


# Takes a template of the dockerfile and creates a new dockerfile with specified
# installation steps
def create_docker_script(template_in, docker_out):

    # Generate pip install commands
    _pip = create_pip_commands(BASE_PIP_PKGS, "RUN ")

    # Generate extension install commands
    EXTS = BASE_EXTENSIONS + EXTRA_EXTENSIONS
    install_ext = create_extension_commands(EXTS, "RUN ")

    CONDA_CHANNELS = BASE_CHANNELS + " " + USER_CHANNELS
    # Combine all settings into dictonary for template to use
    data = {"_base_image": BASE_IMAGE, "_conda_channels": CONDA_CHANNELS,
            "_conda_pkgs": BASE_CONDA_PKGS, "_pip_install": _pip,
            "_install_extensions": install_ext}

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


# Takes a template of the meta.yaml.in and creates new one in recipe folder
def create_meta_yaml(template_in, yaml_out):

    # Generate meta.yaml.in requirements
    host_reqs = ""
    for req in HOST_REQUIREMENTS:
        host_reqs += "\n    - {}".format(req)
    run_reqs = ""
    for req in RUN_REQUIREMENTS:
        run_reqs += "\n    - {}".format(req)

    # Combine all settings into dictonary for template to use
    data = {"_host_reqs": host_reqs, "_run_reqs": run_reqs}

    # Create install file
    update_template(template_in, yaml_out, data)


def main():

    # Generate .circleci/config.yml
    template_in = "{}{}/template_config".format(MAIN_DIR, TEMPLATES_DIR)
    file_out = "{}/.circleci/config.yml".format(MAIN_DIR)
    create_circle_config(template_in, file_out)

    # Generate install_script.sh
    template_in = "{}{}/template_install".format(MAIN_DIR, TEMPLATES_DIR)
    file_out = "{}/install_script.sh".format(MAIN_DIR)
    create_install_script(template_in, file_out)

    # Generate deploy/Dockerfile
    template_in = "{}{}/template_docker".format(MAIN_DIR, TEMPLATES_DIR)
    file_out = "{}/deploy/Dockerfile".format(MAIN_DIR)
    create_docker_script(template_in, file_out)

    # Generate recipe/build.sh
    template_in = "{}{}/template_build".format(MAIN_DIR, TEMPLATES_DIR)
    file_out = "{}/recipe/build.sh".format(MAIN_DIR)
    create_build_script(template_in, file_out)

    # Generate recipe/meta.yaml.in
    template_in = "{}{}/template_meta_yaml".format(MAIN_DIR, TEMPLATES_DIR)
    file_out = "{}/recipe/meta.yaml.in".format(MAIN_DIR)
    create_meta_yaml(template_in, file_out)


if __name__ == '__main__':
    MAIN_DIR = get_main_dir()
    main()
