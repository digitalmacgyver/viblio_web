define(['lib/config','durandal/system','durandal/app', 'lib/viblio'], function( config, system, app, viblio) {
    return {
	notify: function( template, messages ) {
	    var viblio = require( 'lib/viblio' );
	    messages.forEach( function( msg ) {
		// render the template for it
		var html;
		try { 
		    html = ich[template]( msg, true );
		    viblio.notify( html );
		} catch(err) {
		    // This is not nessesarily bad.  Some messages
		    // might just want to send an event, not popup
		    // a user viewable message.
		    system.log( err );
		}
		if ( msg.send_event && msg.send_event.event ) {
		    system.log( '==> triggering ', msg.send_event );
		    app.trigger( msg.send_event.event, 
				 msg.send_event.data );
		}
	    });
	},

	new_video: function( messages ) {
	    // Trigger a ready for each video
	    for( var i=0; i<messages.length; i++ ) {
		app.trigger( 'mediafile:ready', messages[i].media );
	    }
	    // Only do a notification of the first video
	    var model = {
		poster: messages[0].media.views.poster.url
	    };
	    var viblio = require( 'lib/viblio' );
	    viblio.notify( ich.new_video( model, true ) );
	},

	new_comment: function( messages ) {
	    // Do em all
	    var viblio = require( 'lib/viblio' );
	    for( var i=0; i<messages.length; i++ ) {
		viblio.notify( ich.new_comment({
		    poster: messages[i].media.views.poster.url,
		    name: messages[i].user.displayname
		}, true));
	    }
	}

    };

});