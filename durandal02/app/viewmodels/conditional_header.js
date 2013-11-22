/* Combine normal page header and landing header into a single
 * header that displys correctly if the user is logged in or not
 */
define( ['plugins/router', 'durandal/app', 'lib/viblio', 'lib/config'], function(router, app, viblio, config) {
    // The header can show router navigation points.  It also has a logout
    // function.
    //
    return {
	router: router,
	// Show details about the user
	user: viblio.user,
        feedback_email: ko.observable( 'mailto:feedback@' + config.email_domain() ),
        download_link: ko.observable( config.site_server + '/#getApp?from=menu' ),
        
	activate: function() {
	    // force a round trip to
	    return $.getJSON( '/services/user/me' ).then( function( res ) {
		if ( res && res.error ) {
		    viblio.setUser( null );
		}
		else {
		    viblio.setUser( res.user );
		}
	    });
	},
        
        sent_feedback: function() {
	    viblio.mpEvent( 'feedback' );
	    return true;
	},
        
        download_viblio: function() {
	    viblio.mpEvent( 'download_viblio' );
	    return true;
	},
        
	testNewVideo: function() {
	    viblio.api( '/services/test/new_video_test' );
	},
	logout: function() {
	    // Trigger system logout.  Its in system so logouts could
	    // happen from other parts of the app.
	    //
	    app.trigger( 'system:logout' );
	},
        signin: function() {
            router.navigate( 'login' );
        },
        // fix for dropdown menu not working on mobile
        attached: function() {
            $('.dropdown-toggle').click(function(e) {
              e.preventDefault();
              setTimeout($.proxy(function() {
                if ('ontouchstart' in document.documentElement) {
                  $(this).siblings('.dropdown-backdrop').off().remove();
                }
              }, this), 0);
            });
	}
    };
});

