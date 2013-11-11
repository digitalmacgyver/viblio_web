#!/bin/sh
### BEGIN INIT INFO
# Provides: sw
# Required-Start: $local_fs $network $named
# Required-Stop: $local_fs $network $named
# Default-Start: 2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: Worker service for viblio-server
### END INIT INFO 
. /lib/lsb/init-functions

SERVICE_TYPE=prod

APPNAME=sw
APPDIR=/deploy/$SERVICE_TYPE/web-clients/sw-admin
export PORT=3000

VA_CONFIG_LOCAL_SUFFIX=$SERVICE_TYPE
export VA_CONFIG_LOCAL_SUFFIX

USER=www-data
GROUP=www-data

UNIXNAME=$APPNAME

if [ $(id -u) -eq 0 ] ; then
    PIDDIR=/var/run/$UNIXNAME
    mkdir $PIDDIR >/dev/null 2>&1
    chown $USER:$GROUP $PIDDIR
    chmod 775 $PIDDIR
else
    PIDDIR=/tmp
fi

PIDFILE=$PIDDIR/$UNIXNAME${PIDSUFFIX:+"-$PIDSUFFIX"}.pid

_check_sw() {
    if [ -x /usr/local/bin/check-and-install-software.pl ]; then
        /usr/local/bin/check-and-install-software.pl \
            -db $SERVICE_TYPE -app $APPNAME \
            $*
    else
        return 0
    fi
}

check_sw() {
    # Just check if we need to upgrade and return status
    _check_sw -check $*
}

check_and_install() {
    # Check if we need to install, and if so, install and restart
    _check_sw -check -quiet || restart
}

check_running() {
    [ -s $PIDFILE ] && kill -0 $(cat $PIDFILE) >/dev/null 2>&1
}

_start() {
    _check_sw -quiet
    start-stop-daemon --start --make-pidfile --pidfile $PIDFILE \
    --chdir $APPDIR \
    ${USER:+"--chuid"} $USER ${GROUP:+"--group"} $GROUP --background \
    --startas /usr/local/bin/node -- $APPNAME

    for i in 1 2 3 4 5 6 7 8 9 10; do
        sleep 1
        if check_running ; then
            return 0
        fi
    done
    return 1
}

start() {
    log_daemon_msg "Starting $APPNAME" $UNIXNAME
    if check_running; then
        log_progress_msg "already running"
        log_end_msg 0
        exit 0
    fi

    rm -f $PIDFILE 2>/dev/null

    _start
    log_end_msg $?
    return $?
}

_stop() {
    start-stop-daemon --stop --user $USER --quiet --oknodo --pidfile $PIDFILE \
    --retry TERM/5/TERM/30/KILL/30 \
    || log_failure_message "It won't die!"
}

stop() {
    log_daemon_msg "Stopping $APPNAME" $UNIXNAME

    _stop
    log_end_msg $?
    return $?
}

restart() {
    log_daemon_msg "Restarting $APPNAME" $UNIXNAME

    _stop && _start
    log_end_msg $?
    return $?
}

# See how we were called.
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart|force-reload)
        restart
        ;;
    check)
        check_sw
        ;;
    check_quiet)
        check_sw -quiet
        ;;
    check_and_install)
        check_and_install
        ;;
    *)
        echo $"Usage: $0 {start|stop|restart|check|check_quiet|check_and_install}"
        exit 1
esac
exit $?
