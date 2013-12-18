define( ['plugins/router', 'durandal/app', 'lib/viblio', 'lib/config'], function(router, app, viblio, config) {
    var feedback = ko.observable();
    var feedback_email = ko.observable( 'mailto:feedback@' + config.email_domain() );
    var getLocation = function() {
        return window.location.hash;
    };
    
    return {
        feedback: feedback,
        feedback_email: feedback_email,
        getLocation: getLocation,
        
        send_feedback: function() {
	    // add api call to submit feedback form
            viblio.log( feedback() );
            viblio.log( getLocation() );
            viblio.log( feedback_email() );
	}
    };
});