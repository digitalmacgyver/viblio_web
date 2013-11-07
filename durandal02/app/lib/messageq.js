define(['lib/config','durandal/system','durandal/app', 'lib/notify'], function( config, system, app, notify) {
    var mq = null;
    var subscribed = false;
    var last_uuid = null;

    try {
	mq = new Faye.Client( '/mq/faye', {
	    timeout: 120 });
	// These two disable statements are needed when using
	// nginx as a front end to reverse-proxy the faye server.
	mq.disable( 'websocket' );
	mq.disable('eventsource'); 
    } catch( e ) {
	system.log( 'Failed to connect to Faye.' );
    };

    return {
	subscribe: function( uuid, callback ) {
	    if ( mq ) {
		if ( ! subscribed ) {
		    try {
			var s = mq.subscribe( '/messages/' + uuid, function( msg ) {
			    $.ajax({
				url: '/mq/dequeue',
				data: { uid: uuid },
				dataType: 'jsonp',
				success: function( data ) {
				    if ( callback ) {
					callback( data );
				    }
				    else {
					var messages = data.messages;
					system.log( "=> received " + messages.length + " messages" );
					// In the general case, there can be multiple message types,
					// and each type may have muliple messages.  Gather this up
					// into a hash keyed by type.
					var db = {};
					for( var i=0; i<messages.length; i++ ) {
					    if ( ! db[messages[i].type] ) {
						db[messages[i].type] = new Array;
						db[messages[i].type].push( messages[i] );
					    }
					    else {
						db[messages[i].type].push( messages[i] );
					    }
					}
					// Now send them to the right notify function
					for( var type in db ) {
					    // log the event in mixpanel/ga
					    var viblio = require( 'lib/viblio' );
					    viblio.mpEvent( type );
					    if ( notify[type] ) 
						notify[type]( db[type] );
					    else
						notify.notify( type, db[type] );
					}
				    }
				},
				error: function( x, t, e ) {
				    system.log( 'Could not dequeue!' );
				}
			    });
			});
			s.callback( function(arg) {
			    subscribed = true;
			    last_uuid = uuid;
			});
			s.errback( function( err ) {
			    system.log( 'Failed to subscribe to message queue: ' + err );
			    subscribed = false;
			});
		    } catch(e) {
			system.log( 'Failed to subscribe to message queue!' );
		    }
		}
		else {
		    // already subscribed
		}
	    }
	    else {
		system.log( 'Attempt to subscribe to Faye failed: never connected.' );
	    }
	},
	unsubscribe: function() {
	    if ( mq && subscribed ) {
		mq.unsubscribe( '/messages/' + last_uuid );
	    }
	}
    };
});
