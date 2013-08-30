define(['lib/config','lib/viblio','lib/customDialogs','plugins/dialog','durandal/app'], function( config, viblio, customDialogs, dialogs, app ) {
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
	console.log( 'Failed to connect to Faye.' );
    };

    return {
	subscribe: function( uuid, callback ) {
	    if ( mq ) {
		if ( ! subscribed ) {
		    try {
			console.log( 'Attempting to subscribe to /messages/'+ uuid);
			var s = mq.subscribe( '/messages/' + uuid, function( msg ) {
			    console.log( 'Messages! I have ' + msg.count + ' messages waiting' );
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
					console.log( "=> received " + messages.length + " messages" );
					for( var i=0; i<messages.length; i++ ) {
					    app.trigger( 'mediafile:ready', messages[i].media );
					}
					customDialogs.showIncoming( messages );
				    }
				},
				error: function( x, t, e ) {
				    console.log( 'Could not dequeue!' );
				}
			    });
			});
			s.callback( function(arg) {
			    console.log( 'Subscription is now active for: ' + uuid );
			    console.log( arg );
			    subscribed = true;
			    last_uuid = uuid;
			});
			s.errback( function( err ) {
			    console.log( 'Failed to subscribe to message queue: ' + err );
			    subscribed = false;
			});
		    } catch(e) {
			console.log( 'Failed to subscribe to message queue!' );
		    }
		}
		else {
		    // already subscribed
		}
	    }
	    else {
		console.log( 'Attempt to subscribe to Faye failed: never connected.' );
	    }
	},
	unsubscribe: function() {
	    if ( mq && subscribed ) {
		mq.unsubscribe( '/messages/' + last_uuid );
	    }
	}
    };
});
