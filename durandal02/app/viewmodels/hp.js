define(['durandal/app',
        "plugins/router",
	"lib/viblio",
        "lib/customDialogs"],function(app,router,viblio,customDialogs){
    var view;
    var unnamed;
    var top_actors;
    var unamed_is_visible = false;
    var firstTime = ko.observable();
    var yvSection;
   
    // Used to handle message from email to open upload modal
    var user = viblio.user;
    var loggedIn = ko.computed(function(){
        if( user() && user().uuid != null ) {
            return true;
        } else {
            return false;
        }
    });

    app.on( 'unnamed:composed', function( obj ) {
	unamed = obj;
    });

    app.on( 'top-actors:composed', function( obj ) {
	top_actors = obj; 
    });
    
    // Shown after first video upload is completed.
    this.on( 'nginxModal:closed', function() {
	customDialogs.showModal( 'viewmodels/firstTimeUploadModal' ); 
    });

    function handle_visibility( visible ) {
	unamed_is_visible = visible;
	if ( visible ) {
	    $(view).find( '.top-strip .cont' ).css( 'margin-right', '-340px' );
	    $(view).find( '.top-strip .right' ).css( 'display', 'block' );

	    //$(view).find( '.top-strip .cont .left' ).animate({ 'margin-right': '340px' });
	    $(view).find( '.top-strip .cont .left' ).css('margin-right', '340px');
	}
	else {
	    $(view).find( '.top-strip .right' ).css( 'display', 'none' );

	    //$(view).find( '.top-strip .cont' ).animate({ 'margin-right': '0px' });
	    //$(view).find( '.top-strip .cont .left' ).animate({ 'margin-right': '0px' });
	    $(view).find( '.top-strip .cont' ).css( 'margin-right', '0px' );
	    $(view).find( '.top-strip .cont .left' ).css( 'margin-right', '0px' );
	}
	$(top_actors.view).find( ".sd-pscroll").trigger( 'children-changed' );
    }

    app.on( 'unnamed:visibility', function( visible ) {
	handle_visibility( visible );
    });
    
    function showFirstTimeBubble() {
        customDialogs.showModal( 'viewmodels/firstTimeUserModal' );
    };

    return{
        yvSection: yvSection,
        
        activate: function( args ) {
            // When user is routed from email link for 'upload' capture that and open upload modal on login
            if ( args && args.addVideos ) {
                var last_URL = router.activeInstruction().config.route + "?" + router.activeInstruction().queryString;
                if ( loggedIn() ) {
                    customDialogs.showModal( 'viewmodels/nginx-modal' );
                } else {
                    // Set the last attempt to a function that will route the user to the home page and will open the add vids modal
                    viblio.setLastAttempt( function() {
                        router.navigate( last_URL );
                        setTimeout( function(){
                            customDialogs.showModal( 'viewmodels/nginx-modal' );
                        },1000);
                        viblio.setLastAttempt( null );
                    });
                    customDialogs.showModal( 'viewmodels/loginModal', 'Please log in before uploading new videos to your account.' );
                }
            }
                       
            // Used for testing only - remove after testing is complete
            //localStorage.clear();
            
            // check if this is user's first visit
            viblio.localStorage( 'hasUserBeenHereBefore' ).then(function( data ) {
                if ( data ) {
                    firstTime( false );
                } else {
                    firstTime( true );
                    showFirstTimeBubble();
                    viblio.localStorage( 'hasUserBeenHereBefore', true );
                }
            });
            
            this.yvSection = { model:'viewmodels/your-videos' };
            if ( args && args.last_selected ) {
                this.yvSection = { model:'viewmodels/your-videos', activationData: args };
            }

        },
        
	compositionComplete: function( _view ) {
	    view = _view;
	    handle_visibility( unamed_is_visible );
	}
    };
});
