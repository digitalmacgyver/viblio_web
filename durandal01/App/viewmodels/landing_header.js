define( ['durandal/plugins/router'], function( router ) {
    return {
	router: router,
	signin: function() {
	    router.navigateTo( '#/login' );
	}
    };
});
