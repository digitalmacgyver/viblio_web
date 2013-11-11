define(['lib/config','durandal/system','durandal/app', 'lib/viblio'], function( config, system, app, viblio) {
    return {
	notify: function( template, data, level ) {
	    // render the template for it
	    var html;
	    try { 
		html = ich[template]( data, true );
	    } catch(err) {
		html = err;
	    }
	    var viblio = require( 'lib/viblio' );
	    viblio.notify( html, level );
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