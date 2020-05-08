import argparse
import utilities as u

MSG_LOCAL_BUILD = "Building a local NPM Package for extension build..."
MSG_BUILDING_IMAGE = "Building Docker image with tag: {} ..."
MSG_PUBLISH_IMAGE = "Publishing image to Docker Hub using tags: {}"
MSG_USING_VERSION = ("Using NPM package 'jupyter-vcdat@{}' "
                     "for extension build...")

SHOW_PROGRESS = False
SHOW_CMDS = False
SHOW_ALL = False


def main():
    prog = "python deploy_docker.py "
    descr = ("This tool automates the process of building and deploying "
             "Docker images of Jupyter-VCDAT.")
    parser = argparse.ArgumentParser(prog, None, descr)
    group = parser.add_mutually_exclusive_group()
    group2 = parser.add_argument_group()

    # Add argument options
    group.add_argument('--local', '-l', action="store_true",
                       help=("<Optional> Generate the image from local the"
                             "current directory instead of using an npm package."))
    group.add_argument('--version', '-v', default="nightly",
                       help=("<Optional> The npm version of jupyter-vcdat to "
                             "use when building the image."))
    group2.description = "Publishing built image(s) to DockerHub:"
    group2.add_argument('--publish', '-p', nargs='+', metavar="version",
                        help=("<Optional> After the image is built, push it "
                              "to DockerHub using specified version(s)."))
    group2.add_argument('--repo', '-r', default="cdat/vcdat",
                        help=("<Optional> The docker repository to use when "
                              "publishing the docker image(s). Default: cdat/vcdat"))
    parser.add_argument('--status', '-s', type=int, choices=[0, 1, 2, 3],
                        default=1, help=("<Optional> Select amount of verbosity"
                                         " to use when displaying deployment progress. "
                                         "Choices:\n0: Do not print anything.\n"
                                         "1: Print progress messages.\n"
                                         "2: Print progress and commands.\n"
                                         "3: Print progress, commands and shell output.\n"))
    parser.add_argument('--run', nargs='?', const=9000, type=int,
                        help=("<Optional> Run the docker image after it is "
                              "built so it can be view in browser. "
                              "Default port: 9000"))
    parser.add_argument("tag", help="Tag to use for Docker image.")

    args = parser.parse_args()

    # Verbose: 0 = no messages, 1 = progress only
    # 2 = progress and commands, 3 = all messages
    global SHOW_PROGRESS
    global SHOW_CMDS
    global SHOW_ALL
    verbosity = int(args.status)

    if verbosity > 2:
        SHOW_ALL = True
    if verbosity > 1:
        SHOW_CMDS = True
    if verbosity > 0:
        SHOW_PROGRESS = True

    # Determine whether to create a local npm package
    local = False  # Default is to use published npm package
    if args.local:
        # If local, build a local npm package with npm pack, for image build
        local = True
        create_local_package()
    else:
        print_progress(MSG_USING_VERSION.format(args.version))

    # Build docker image
    build_docker_image(local, args.tag, args.version)

    if args.run:
        run_docker(args.tag, args.run)

    if args.publish:
        tags = ""
        for t in args.publish:
            tags += "\n{}:{}".format(args.repo, t)
        print_progress(MSG_PUBLISH_IMAGE.format(tags))
        publish_docker(args.tag, args.repo, args.publish)


def print_progress(msg):
    if SHOW_PROGRESS:
        print(msg)


def print_cmd(cmd):
    HIDE = not SHOW_ALL
    try:
        u.run_cmd(cmd, HIDE, SHOW_CMDS)
    except Exception as e:
        raise(e)


def create_local_package():
    try:
        # NPM Pack the current working directory for docker build
        print_cmd("cd {}".format(MAIN_DIR))
        print_progress("...working (1/7)...")
        print_cmd("npm pack")
        print_progress("...working (2/7)...")
        print_cmd("tar xzvf jupyter-vcdat-*.tgz")
        print_progress("...working (3/7)...")
        print_cmd("rm -rf jupyter-vcdat-*.tgz")
        print_cmd("mv package deploy/local_package")
        print_progress("...working (4/7)...")

        # Modify package.json so that npm won't erase node_modules when preparing
        LOCAL_PATH = "{}/deploy/local_package".format(MAIN_DIR)
        u.modify_json_file(LOCAL_PATH + "/package.json",
                           ["scripts", "prepare"], "npm run build")
        print_progress("...working (5/7)...")
        print_cmd("cd {} && npm install".format(LOCAL_PATH))
        print_progress("...working (6/7)...")
        # Remove npm lock file.
        print_cmd("rm -rf deploy/local_package/*-lock.json")
        print_progress("...working (7/7)...")

        print_progress("Done!")
    except Exception as e:
        raise(e)


def build_docker_image(local_npm, image, version):
    print_progress(MSG_BUILDING_IMAGE.format(image))
    try:
        LOCAL_PATH = "{}/deploy".format(MAIN_DIR)
        CMD = "cd {} && docker build -t {}".format(
            LOCAL_PATH, image)
        if local_npm:
            CMD += " --pull -f DEV.Dockerfile ."
        else:
            CMD += " --pull --build-arg npm_version={} .".format(version)
        print_cmd(CMD)
        # Remove local_package if it exists...
        print_cmd("rm -rf deploy/local_package")
        print_progress("Done!")
    except Exception as e:
        raise(e)


def publish_docker(image, repo, versions):
    # Create tags and push
    for v in versions:
        print_progress("Publishing image: {} as {}:{}".format(image, repo, v))
        print_cmd("docker tag {} {}:{}".format(image, repo, v))
        print_cmd("docker push {}:{}".format(repo, v))
    print_progress("Done!")


def run_docker(image, port):
    print_progress("Starting up Docker Image: {} ...".format(image))
    CMD = "docker run -p {p}:{p} ".format(p=port)
    CMD += "-it {} jupyter lab --port={}".format(image, port)
    print_cmd(CMD)


if __name__ == '__main__':
    MAIN_DIR = u.get_main_dir()
    main()
