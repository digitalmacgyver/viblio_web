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
	isUserLoggedIn: function() {
	    return user().uuid;
	},

	api: function( url, data ) {
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
		deferred.reject( x, 'error' );
	    });

	    x.done( function( data, status, xhr ) {
		if ( data && data.error && data.code ) {
		    if ( data.code == 401 || data.code == 403 ) {
			// authentication failure; redirect back to login page
			self.debug( 'Must (re)authenticate!' );
			if ( data.message && data.message == 'Login failed' ) {
			    // I am already on the login page!
			    dialogs.showMessage( 'Authentication Failure', 'Login Failed' );
			}
			else {
			    self.setLastAttempt( router.activeRoute().hash );
			    router.navigate( '#/login' );
			}
		    }
		    else {
			dialogs.showMessage( 'No code: Message: ' + data.message + ', ' + data.detail, 'API Error' );
		    }
		    deferred.reject( x, 'error' );
		}
		else if ( data && data.error ) {
		    dialogs.showMessage( data.message + ', ' + data.detail, 'API Error' );
		}
		else {
		    deferred.resolve( data, status, xhr );
		}
	    });

	    return promise;
	}
    };
});
