/* Combine normal page header and landing header into a single
 * header that displys correctly if the user is logged in or not
 */
define( ['plugins/router', 'durandal/app', 'lib/viblio'], function(router, app, viblio) {
    // The header can show router navigation points.  It also has a logout
    // function.
    //
    return {
	router: router,
	// Show details about the user
	user: viblio.user,
        
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
            router.navigate( '#/login' );
        }        
    };
});

