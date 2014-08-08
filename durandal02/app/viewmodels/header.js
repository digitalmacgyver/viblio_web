/* A common header.  
 */
define( ['plugins/router', 
	 'durandal/app', 
	 'lib/viblio', 
	 'lib/config', 
	 'lib/customDialogs',
         'durandal/events',
         'plugins/dialog'], 
function(router, app, viblio, config, dialogs, Events, dialog) {
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
    
    // content used for title of popover - adds close button so it can be dismissed
    var pt = '<span><strong>Get Started</strong></span>'+
                '<button type="button" id="close" class="close" onclick="$(&quot;.web-uploader-header-button&quot;).popover(&quot;hide&quot;);">&times;</button>';
        
    function showPrivacy() {
        dialogs.showModal( 'viewmodels/privacyMatters' );
    }    
    
    return {
        
        pt: pt,
        
        showPopup: showPopup,
	router: router,
        showPrivacy: showPrivacy,
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
        inviteFriends: function() {
            var args = {};
            args.template = 15;
            args.placeholder = "I discovered Viblio, a great way to privately organize and share videos.  I'd love it if you signed up and shared some of your videos with me.";
            args.logout = false;
            dialog.show('viewmodels/loggedOutTellFriendsModal', args);
        },
	web_uploader: function() {
            viblio.localStorage( 'hasUserPushedUploadBefore', true );
            if ( showPopup() ) {
                dialogs.showModal( 'viewmodels/firstTimeUserModal2' );
            } else {
                dialogs.showModal( 'viewmodels/nginx-modal' );
            }
            showPopup( false );
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
