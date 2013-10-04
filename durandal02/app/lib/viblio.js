define(['plugins/router', 'durandal/app', 'durandal/system', 'lib/messageq', 'plugins/dialog'], function (router, app, system, messageq, dialogs) {

    // The currently logged in user
    var user = ko.observable();
    var setUser = function( u ) {
	if ( u ) {
	    if ( u.uuid != user().uuid ) {
		// Don't change it if its the same user, to prevent
		// subscribe callbacks from firing.
		user( u );
		// subscribe to the async message queue
		messageq.subscribe( u.uuid );
	    }
	}
	else {
	    user({
		displayname: 'anonymous',
		uuid: null
	    });
	    messageq.unsubscribe();
	}
    };
    setUser( null );

    var getUser = function() {
	return user();
    };

    var last_attempted_url = null;

    // support for a timed logout.  Needed for the 'tell a friend' functionality.
    var logoutTimeout;
    var scheduleLogout = function( seconds ) {
	var self = this;
	seconds = seconds || 60;
	logoutTimeout = setTimeout( function() {
	    console.log( 'REALLY LOGGING OUT' );
	    self.api( '/services/na/logout' ).then( function() {
		self.setUser( null );
		router.navigate( '#/login' );
	    });
	}, ( 1000 * seconds ) );
    };
    var rescheduleLogout = function( seconds ) {
	console.log( 'RESCHEDULING LOGOUT' );
	if ( logoutTimeout ) clearTimeout( logoutTimeout );
	logoutTimeout = null;
	this.scheduleLogout( seconds );
    }
    var cancelScheduledLogoutAndLogout = function() {
	var self = this;
	if ( logoutTimeout ) clearTimeout( logoutTimeout );
	logoutTimeout = null;
	self.api( '/services/na/logout' ).then( function() {
	    self.setUser( null );
	    router.navigate( '#/login' );
	});
    }

    return {
	// log() and debug() should maybe use console.log
	// during development, but then http://log4javascript.org/
	// for production
	debug: function( msg ) {
	    system.log( msg );
	},

	log: function( msg ) {
	    system.log( msg );
	},

	log_error: function( msg ) {
	    system.log( msg );
	},

	setLastAttempt: function( attempt ) {
	    last_attempted_url = attempt;
	},
	getLastAttempt: function() {
	    return last_attempted_url;
	},
	
	setUser: setUser,
	getUser: getUser,
	user: user,

	scheduleLogout: scheduleLogout,
	rescheduleLogout: rescheduleLogout,
	cancelScheduledLogoutAndLogout: cancelScheduledLogoutAndLogout,

	isUserLoggedIn: function() {
	    return user().uuid;
	},

	api: function( url, data, errorCallback ) {
	    var self = this;

	    var deferred = $.Deferred();
	    var promise  = deferred.promise();
	    var x = $.getJSON( url, data );

	    x.fail( function( jqXHR, textStatus, errorThrown ) {
		if ( jqXHR.status == 403 || jqXHR.status == 0 ) {
		    // old fashion auth failure
		}
		else {
		}
		self.log( 'AJAX FAIL' );
		if ( errorCallback )
		    errorCallback({message: 'Cannot communicate with server',
				   detail: url });
		deferred.reject( x, 'error' );
	    });

	    x.done( function( data, status, xhr ) {
		if ( data && data.error && data.code ) {
		    if ( data.code == 401 || data.code == 403 ) {
			// authentication failure; redirect back to login page
			self.debug( 'Must (re)authenticate!' );
			if ( data.message && data.message == 'Login failed' ) {
			    // I am already on the login page!
			    if ( errorCallback )
				errorCallback({message: 'Authentication Failure',
					       detail: 'Login Failed' });
			    else
				dialogs.showMessage( 'Authentication Failure', 'Login Failed' );
			}
			else {
			    self.setLastAttempt( router.activeInstruction().config.route );
			    router.navigate( 'login' );
			}
		    }
		    else {
			if ( errorCallback )
			    errorCallback({message: data.message,
					   detail: data.detail });
			else
			    dialogs.showMessage( 'No code: Message: ' + data.message + ', ' + data.detail || 'no detail', 'API Error' );
		    }
		    deferred.reject( x, 'error' );
		}
		else if ( data && data.error ) {
		    if ( errorCallback )
			errorCallback({message: data.message,
				       detail: data.detail });
		    else
			dialogs.showMessage( data.message + ', ' + data.detail || 'no detail', 'API Error' );
		}
		else {
		    deferred.resolve( data, status, xhr );
		}
	    });

	    return promise;
	}
    };
});
