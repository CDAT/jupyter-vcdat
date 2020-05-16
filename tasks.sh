CUR_DIR=$(pwd)
SCR_DIR=$(dirname $0)/scripts
cd $SCR_DIR
python dev_tasks.py "$@" || {
    echo \'$1\' 'command failed.'
    exit 1
}
cd $CUR_DIR
