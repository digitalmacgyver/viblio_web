define(['plugins/router', 'lib/viblio'], function( router, viblio ) {
    var error = ko.observable( viblio._why ? viblio._why.error : 'Unknown error' );
    var reason = ko.observable( viblio._why ? viblio._why.reason : 'Unknown reason' );
    return {
	debug: ko.observable( true ),
	error: error,
	reason: reason,
	outtahere: function() {
	    router.navigate( 'home' );
	}
    };
});
