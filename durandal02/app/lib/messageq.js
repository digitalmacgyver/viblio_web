define(['lib/config','durandal/system','durandal/app'], function( config, system, app) {
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
				    var viblio = require( 'lib/viblio' );
				    viblio.mpEvent( 'upload' );
				    if ( callback ) {
					callback( data );
				    }
				    else {
					var messages = data.messages;
					system.log( "=> received " + messages.length + " messages" );
					for( var i=0; i<messages.length; i++ ) {
					    app.trigger( 'mediafile:ready', messages[i].media );
					}
					var img = '<img src="' + messages[0].media.views.poster.url + 
					    '" width="80" height="45" style="vertical-align: text-top; margin-right: 3px;"/>';
					var txt = 'New video available!';
					var viblio = require( 'lib/viblio' );
					viblio.notify( img + txt );
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
