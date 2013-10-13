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
	    if ( u.displayname != user().displayname ) {
		user( u );
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

	// Log a google analytics page view
	gaPage: function( title, page ) {
	    ga( 'send', 'pageview', {
		title: title, page: page });
	    mixpanel.track_pageview( page );
	},

	// Log a google analytics event.  This function automatically
	// attaches the "page" (or route) that was active when this
	// call was made.
	gaEvent: function( category, action, label, value ) {
	    var page = '/' + ( router.activeInstruction().fragment || 'unknown' );
	    if ( value )
		ga( 'send', 'event', category, action, label, value, { 'page': page } );
	    else if ( label )
		ga( 'send', 'event', category, action, label, { 'page': page } );
	    else 
		ga( 'send', 'event', category, action, { 'page': page } );
	    mixpanel.track( category, { action: action,
					label: label,
					value: value,
					page: page });
	},

	// Log a google analytics "social" event
	gaSocial: function( network, action, target ) {
	    var page = '/' + ( router.activeInstruction().fragment || 'unknown' );
	    target = target || 'no_target_specified';
	    ga( 'send', 'social', network, action, target, { 'page': page } );
	    mixpanel.track( 'social', { network: network,
					action: action,
					target: target,
					page: page });
	},

	// Log a timed event to google analytics.  This is a report of
	// how long something took to complete.
	gaTime: function( category, variable, value, label ) {
	    var page = '/' + ( router.activeInstruction().fragment || 'unknown' );
	    if ( label )
		ga( 'send', 'timing', category, variable, value, label, { 'page': page } );
	    else
		ga( 'send', 'timing', category, variable, value, { 'page': page } );

	    mixpanel.track( 'timing', { category: category,
					variable: variable,
					value: value,
					page: page });
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
			if ( data.message && ( data.message.indexOf( 'Login failed' ) == 0 ) ) {
			    // I am already on the login page!
			    if ( errorCallback )
				errorCallback({message: 'Authentication Failure',
					       detail: data.message });
			    else
				dialogs.showMessage( data.message, 'Authentication Failure' );
			}
			else {
			    if ( self.getLastAttempt() == null )
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
