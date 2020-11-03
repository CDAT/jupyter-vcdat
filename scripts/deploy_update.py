import os
import utilities as u
from string import Template

# TEMPLATES LOCATION
TEMPLATES_DIR = "/deploy/deploy_templates"

# Docker base image
BASE_IMAGE = "nimbus16.llnl.gov:8443/default/nimbus-jupyterlab:1.0.0"

# Docker selenium test images
TEST_CHROME_IMAGE = "selenium/node-chrome"
TEST_FIREFOX_IMAGE = "selenium/node-firefox"

# Tag used to publish docker image
VCDAT_IMAGE_TAG = "cdat/vcdat"

# Host requirements for conda package
HOST_REQUIREMENTS = ["jupyterlab", "nodejs", "pip", "'python>=3.7'"]

# Run requirements for conda package
RUN_REQUIREMENTS = ["'cdms2>=3.1.5'", "ipywidgets", "jupyterhub", "jupyterlab", "nb_conda",
                    "nb_conda_kernels", "'python>=3.7'", "tqdm", "vcs"]

# dev conda channels (for developer deployment)
DEV_CHANNELS = "-c cdat/label/v8.2.1 -c conda-forge"

# user conda channels (for stable deployment)
USER_CHANNELS = "-c cdat/label/v8.2.1 -c conda-forge"

# channels used for conda upload (conda deployment)
UPLOAD_CHANNELS = "-c cdat/label/v8.2.1 -c conda-forge -c cdat"

# extra channels used for extra packages ( not used by default )
EXTRA_CHANNELS = "-c pcmdi/label/nightly"

# OS specific packages to use based on environment
BASE_LINUX_PKGS = "'mesalib=18.3.1'"
BASE_MAC_PKGS = "'mesalib=17.3.9'"

# base packages (always added)
BASE_CONDA_PKGS = "pip cdms2 vcs tqdm nodejs 'python=3.7'"
BASE_CONDA_PKGS += " jupyterlab jupyterhub ipywidgets numpy"

# extra packages ( Not included by default )
EXTRA_PACKAGES = "vcsaddons thermo cmor eofs windspharm autopep8 "
EXTRA_PACKAGES += "scikit-learn wk nb_conda nb_conda_kernels plumbum scipy"

# dev and test packages (for developer deployment)
DEV_CONDA_PKGS = "testsrunner cdat_info"

# base pip packages (always installed)
BASE_PIP_PKGS = ["sidecar"]

# dev pip packages (required only for developer deployment)
DEV_PIP_PKGS = ["flake8", "selenium", "pyvirtualdisplay"]

# REQURIED JupyterLab extensions to install (not including Jupyter-VCDAT)
BASE_EXTENSIONS = [
    "@jupyter-widgets/jupyterlab-manager",
    "@jupyter-widgets/jupyterlab-sidecar",
    "jupyterlab-tutorial-extension",
    "@jupyterlab/hub-extension"
]

# EXTRA JupyterLab extensions (installed but not required)
EXTRA_EXTENSIONS = []

# This is the sidecar package being used by build.sh
# Link comes from here: https://pypi.org/project/sidecar/#files
SIDECAR_PIP = ("https://files.pythonhosted.org/packages/55/a4/"
               "6c81cc08e5a307e692659fdc3a9a1a031d173a4c79d053"
               "9cbd20e357fa75/sidecar-0.4.0-py2.py3-none-any.whl")


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

    # Generate pip install commands
    pip = f"pip install {SIDECAR_PIP}"

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
def create_docker_script(template_user, template_dev, user_out, dev_out):

    # Generate pip install commands
    _pip = create_pip_commands(BASE_PIP_PKGS, "RUN ")

    # Generate extension install commands
    EXTS = BASE_EXTENSIONS + EXTRA_EXTENSIONS
    install_ext = create_extension_commands(EXTS, "RUN ", post=" --no-build")

    # Combine all settings into dictonary for template to use
    data = {"_base_image": BASE_IMAGE, "_conda_channels": USER_CHANNELS,
            "_conda_pkgs": BASE_CONDA_PKGS, "_pip_install": _pip,
            "_install_extensions": install_ext, "_linux_pkgs": BASE_LINUX_PKGS}

    # Create user docker file
    update_template(template_user, user_out, data)

    # Change to DEV channels for dev version
    data['_conda_channels'] = DEV_CHANNELS

    # Create dev docker file
    update_template(template_dev, dev_out, data)

# Takes a template of the installer script and creates a new install script with specified
# conda channels and packages.


def create_install_script(template_in, installer_out):

    # Generate pip install commands
    base_pip = create_pip_commands(BASE_PIP_PKGS)
    dev_pip = create_pip_commands(DEV_PIP_PKGS, "\t")

    # Generate extension install commands
    EXTS = BASE_EXTENSIONS + EXTRA_EXTENSIONS
    install_ext = create_extension_commands(EXTS, post=" --no-build")

    # Combine all settings into dictonary for template to use
    data = {"_dev_channels": DEV_CHANNELS, "_user_channels": USER_CHANNELS,
            "_base_conda_pkgs": BASE_CONDA_PKGS, "_dev_conda_pkgs": DEV_CONDA_PKGS,
            "_base_pip_install": base_pip, "_dev_pip_install": dev_pip,
            "_install_extensions": install_ext, "_linux_pkgs": BASE_LINUX_PKGS,
            "_mac_pkgs": BASE_MAC_PKGS}

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
    template_user = "{}{}/template_docker".format(MAIN_DIR, TEMPLATES_DIR)
    template_dev = "{}{}/template_dev_docker".format(MAIN_DIR, TEMPLATES_DIR)
    user_out = "{}/deploy/Dockerfile".format(MAIN_DIR)
    dev_out = "{}/deploy/DEV.Dockerfile".format(MAIN_DIR)
    create_docker_script(template_user, template_dev, user_out, dev_out)

    # Generate recipe/build.sh
    template_in = "{}{}/template_build".format(MAIN_DIR, TEMPLATES_DIR)
    file_out = "{}/recipe/build.sh".format(MAIN_DIR)
    create_build_script(template_in, file_out)

    # Generate recipe/meta.yaml.in
    template_in = "{}{}/template_meta_yaml".format(MAIN_DIR, TEMPLATES_DIR)
    file_out = "{}/recipe/meta.yaml.in".format(MAIN_DIR)
    create_meta_yaml(template_in, file_out)


if __name__ == '__main__':
    MAIN_DIR = u.get_main_dir()
    main()
