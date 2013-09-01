define(['lib/config','durandal/system','lib/customDialogs','plugins/dialog','durandal/app'], function( config, system, customDialogs, dialogs, app ) {
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
			system.log( 'Attempting to subscribe to /messages/'+ uuid);
			var s = mq.subscribe( '/messages/' + uuid, function( msg ) {
			    system.log( 'Messages! I have ' + msg.count + ' messages waiting' );
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
					for( var i=0; i<messages.length; i++ ) {
					    app.trigger( 'mediafile:ready', messages[i].media );
					}
					customDialogs.showIncoming( messages );
				    }
				},
				error: function( x, t, e ) {
				    system.log( 'Could not dequeue!' );
				}
			    });
			});
			s.callback( function(arg) {
			    system.log( 'Subscription is now active for: ' + uuid );
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
