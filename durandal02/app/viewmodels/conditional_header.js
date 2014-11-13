/* Combine normal page header and landing header into a single
 * header that displys correctly if the user is logged in or not
 */
define( ['plugins/router', 
	 'durandal/app', 
	 'lib/viblio', 
	 'lib/config',
	 'lib/customDialogs',
	 'plugins/dialog'], 
function(router, app, viblio, config, dialogs, dialog) {
    // The header can show router navigation points.  It also has a logout
    // function.
    
    var avatar = ko.observable( "/services/user/avatar?uid=-&y=37" );
    
    return {
	router: router,
	// Show details about the user
	user: viblio.user,
        avatar: avatar,
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
        
        updateAvatar: function() {
            avatar( null );
            avatar( "/services/user/avatar?uid=-&y=37"+new Date() );
        },
        
        sent_feedback: function() {
	    viblio.mpEvent( 'feedback' );
	    return true;
	},
        
        download_viblio: function() {
	    viblio.mpEvent( 'download_viblio' );
	    return true;
	},
        inviteFriends: function() {
            var args = {};
            args.template = 15;
            args.placeholder = "I discovered Viblio, a great way to privately organize and share videos.  I'd love it if you signed up and shared some of your videos with me.";
            args.logout = false;
            dialog.show('viewmodels/loggedOutTellFriendsModal', args);
        },
	web_uploader: function() {
	    dialogs.showModal( 'viewmodels/nginx-modal' );
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
