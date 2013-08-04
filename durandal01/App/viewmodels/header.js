/* A common header.  
 */
define( ['durandal/plugins/router', 'durandal/app', 'lib/viblio'], function(router,app,viblio) {
    // The header can show router navigation points.  It also has a logout
    // function.
    //
    return {
	router: router,
	// Show details about the user
	user: viblio.user,
	logout: function() {
	    // Trigger system logout.  Its in system so logouts could
	    // happen from other parts of the app.
	    //
	    app.trigger( 'system:logout' );
	}
    };
});
