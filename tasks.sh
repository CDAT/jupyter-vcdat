CUR_DIR=`pwd`
SCR_DIR=`dirname $0`/scripts
cd $SCR_DIR
python dev_tasks.py "$@"
cd $CUR_DIR