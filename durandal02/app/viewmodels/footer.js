define( ['plugins/router', 'durandal/app', 'lib/viblio', 'lib/config'], function(router, app, viblio, config) {
    var feedback = ko.observable();
    var feedback_email = ko.observable( 'feedback@' + config.email_domain() );
    var feedback_location = function() {
        return window.location.hash;
    };
    
    return {
        feedback: feedback,
        feedback_email: feedback_email,
        feedback_location: feedback_location,
        
        send_feedback: function() {
            var args;
            args = {
                feedback: feedback(),
                feedback_email: feedback_email(),
                feedback_location: feedback_location()
            };
            viblio.api('/services/na/form_feedback', args).then(function(){
                viblio.mpEvent( 'feedback' );
		viblio.notify( 'Thank you for your feedback', 'success' );
            });
	}
    };
});