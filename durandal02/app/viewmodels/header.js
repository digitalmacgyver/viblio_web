/* A common header.  
 */
define( ['plugins/router', 
	 'durandal/app', 
	 'lib/viblio', 
	 'lib/config', 
	 'lib/customDialogs',
         'durandal/events'], 
function(router, app, viblio, config, dialogs, Events) {
    // The header can show router navigation points.  It also has a logout
    // function.
    //
    var showPopup = ko.observable();
    Events.includeIn( this );
    
    this.on( 'firstTimeUserModal:closed', function() {
        if ( showPopup() ) {
            $('.web-uploader-header-button').popover('show');
        }
    });
    
    return {
        showPopup: showPopup,
	router: router,
	// Show details about the user
	user: viblio.user,
	feedback_email: ko.observable( 'mailto:feedback@' + config.email_domain() ),
        download_link: ko.observable( config.site_server + '/#getApp?from=menu' ),

	sent_feedback: function() {
	    viblio.mpEvent( 'feedback' );
	    return true;
	},

	download_viblio: function() {
	    viblio.mpEvent( 'download_viblio' );
	    return true;
	},
	web_uploader: function() {
            viblio.localStorage( 'hasUserPushedUploadBefore', true );
            showPopup(false);
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
        activate: function() {
            // check if this is user's first visit
            /*firstTime( localStorage.firstVisit );
            if ( firstTime() ) {
                $('.web-uploader-header-button').popover('show');
            }*/
            // check if this is user's first visit
            viblio.localStorage( 'hasUserPushedUploadBefore' ).then(function( data ) {
                if ( data ) {
                    showPopup( false );
                } else {
                    showPopup( true );
                }
            });
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
