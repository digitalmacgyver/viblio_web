define(['plugins/router', 'durandal/app', 'durandal/system', 'lib/messageq', 'lib/customDialogs'], function (router, app, system, messageq, dialogs) {
    $.ajaxSetup({cache:false});
    // The currently logged in user
    var user = ko.observable();

    var cached_gifs = {};

    var setUser = function( u ) {
	if ( u ) {
	    if ( u.uuid != user().uuid ) {
		// Don't change it if its the same user, to prevent
		// subscribe callbacks from firing.
		user( u );
		// subscribe to the async message queue
		messageq.subscribe( u.uuid );
		// Add this identity to mixpanel
		mixpanel.identify( u.uuid );  // unique key is user uuid
		mixpanel.register({ uuid: u.uuid }); // send user uuid on every event
		mixpanel.alias( u.uuid ); // aliases our uuids to mixpanels uuids
	    }
	    if ( u.displayname != user().displayname ) {
		user( u );
	    }
	    mixpanel.people.set({
		"$email": u.email,
		"$last_login": new Date(),
		"$created": u.created_date
	    });
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
	    self.api( '/services/na/logout' ).then( function() {
		self.setUser( null );
		router.navigate( 'login' );
	    });
	}, ( 1000 * seconds ) );
    };
    var rescheduleLogout = function( seconds ) {
	if ( logoutTimeout ) clearTimeout( logoutTimeout );
	logoutTimeout = null;
	this.scheduleLogout( seconds );
    };
    var cancelScheduledLogoutAndLogout = function() {
	var self = this;
	if ( logoutTimeout ) clearTimeout( logoutTimeout );
	logoutTimeout = null;
	self.api( '/services/na/logout' ).then( function() {
	    self.setUser( null );
	    router.navigate( 'login' );
	});
    };

    return {
	cached_gifs: cached_gifs,

	// log() and debug() should maybe use 
	//    http://log4javascript.org/
	// for production
	debug: function() {
	    system.log.apply( null, arguments );
	},

	log: function() {
	    system.log.apply( null, arguments );
	},

	log_error: function() {
	    system.log.apply( null, arguments );
	},

	// Use alertify to notify the user with a small slideout
	// in the lower right.  type can be null (black), success (green)
	// or error (red).  Wait can be 0 to keep the notification on
	// the screen until user clicks on it.
	notify: function( msg, type, wait ) {
	    alertify.log( msg, type, wait );
	},

	setLastAttempt: function( attempt, qs ) {
	    last_attempted_url = attempt;
	    if ( qs ) last_attempted_url = last_attempted_url + '?' + qs;
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

	// Log a google analytics event.  This function automatically
	// attaches the "page" (or route) that was active when this
	// call was made.
	gaEvent: function( category, action, label, value ) {
	    if ( window.location.hostname != 'viblio.com' ) return;
	    var page = '/' + ( router.activeInstruction().fragment || 'unknown' );
	    if ( value )
		ga( 'send', 'event', category, action, label, value, { 'page': page } );
	    else if ( label )
		ga( 'send', 'event', category, action, label, { 'page': page } );
	    else 
		ga( 'send', 'event', category, action, { 'page': page } );
	},

	// Mixpanel Page View
	mpPage: function( title, page ) {
	    if ( window.location.hostname != 'viblio.com' ) return;
	    mixpanel.track_pageview( page );
	    ga( 'send', 'pageview', {
		title: title, page: page });
	},

	// Mixpanel Event log
	// The current page fragment gets added automatically.
	mpEvent: function( event, options ) {
	    if ( window.location.hostname != 'viblio.com' ) return;
	    if ( ! options )
		options = {};
	    if ( ! options['page'] ) {
		if ( router && router.activeInstruction && router.activeInstruction().fragment )
		    options['page'] = '/' + router.activeInstruction().fragment;
		else 
		    options['page'] = '/unknown';
	    }
	    mixpanel.track( event, options );
	    ga( 'send', 'event', event, 'interact', { 'page': options['page'] } );
	},
        
        localStorage: function( key, val ) {
            var deferred = $.Deferred();
            key = user().uuid + ':' + key;
            if ( val ) {
                localStorage.setItem( key, val );
                deferred.resolve();
            } else {
                if ( localStorage.getItem( key ) ) {
                    deferred.resolve( localStorage.getItem( key ) );
                } else {
                    deferred.resolve( false );
                }
            }
            
            //deferred.resolve( localStorage );
            
            return deferred.promise();
        },

        // Increment people properties to send notifications based off of them
        // Use example: viblio.mpPeopleIncrement('Video View Count', 1);                    
        mpPeopleIncrement: function( event, options ) {
            mixpanel.people.increment( event, options );
        },
        
        // Set people properties to send notifications based off of them
        // Use example: viblio.mpPeopleSet({'Last Video Viewed Date': new Date() });
        mpPeopleSet: function( obj ) {
            mixpanel.people.set( obj );
        },

	api: function( url, data, errorCallback ) {
	    var self = this;

	    self.log( '**', url, data );

	    var deferred = $.Deferred();
	    var promise  = deferred.promise();
	    var x = $.getJSON( url, data );

	    x.fail( function( jqXHR, textStatus, errorThrown ) {
		if ( jqXHR.status == 403 || jqXHR.status == 0 ) {
		    // old fashion auth failure
		}
		else {
		}

		self.mpEvent( 'serverError', { reason: 'cannot connect' } );
		self.notify( 'Server communication failure!', 'error' );

		if ( errorCallback )
		    errorCallback({message: 'Cannot communicate with server',
				   detail: url });
		deferred.reject( x, 'error' );
	    });

	    x.done( function( data, status, xhr ) {
		if ( data && data.error && data.code ) {
		    if ( data.code == 401 || data.code == 403 ) {
			// authentication failure; redirect back to login page
			if ( data.detail && ( data.detail.indexOf( 'NOLOGIN' ) == 0 ) ) {
			    // I am already on the login page!
			    self.mpEvent( 'loginFailed', { reason: data.detail } );
			    if ( errorCallback )
				errorCallback({message: 'Authentication Failure',
					       detail: data.message, 
					       code: data.detail });
			    else
				dialogs.showMessage( data.message, 'Authentication Failure' );
			}
			else {
			    if ( self.getLastAttempt() == null )
				self.setLastAttempt( router.activeInstruction().config.route );
			    router.navigate( 'login' );
			}
		    }
		    else if ( data.detail && data.detail.match( /NOLOGIN_/g ) ) {
			self.mpEvent( 'loginFailed', { reason: data.detail } );
			if ( errorCallback )
			    errorCallback({message: 'Authentication Failure',
					   detail: data.message, 
					   code: data.detail });
			else
			    dialogs.showMessage( data.message, 'Authentication Failure' );
		    }
		    else {
			if ( errorCallback ) {
			    errorCallback({message: data.message,
					   detail: data.detail });
			}
			else {
			    self.mpEvent( 'serverError', { reason: 'bad request' } );
			    self.notify( data.message, 'error' );
			    self.log( 'API (bad request) ERROR' );
			    self.log( data.message );
			    self.log( data.detail );
			}
		    }
		    deferred.reject( x, 'error' );
		}
		else if ( data && data.error ) {
		    if ( errorCallback ) {
			errorCallback({message: data.message,
				       detail: data.detail });
		    }
		    else {
			self.mpEvent( 'serverError', { reason: 'server exception' } );
			self.notify( 'Server exception', 'error' );
			self.log( 'API (exception) ERROR' );
			self.log( data.message );
			self.log( data.detail );
		    }
		}
		else {
		    deferred.resolve( data, status, xhr );
		}
	    });

	    return promise;
	}
    };
});
