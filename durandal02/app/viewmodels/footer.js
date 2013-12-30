define( ['plugins/router', 'durandal/app', 'lib/viblio', 'lib/config', 'durandal/system'], function(router, app, viblio, config, system) {
    var feedback = ko.observable();
    var feedback_email = ko.observable( 'feedback@' + config.email_domain() );
    var feedback_location = function() {
        return window.location.hash;
    };
    var location = ko.observable();
    
    router.on('router:route:activating').then(function(instance, instruction, router){
        location(instruction.config.title);
    });
    
    return {
        feedback: feedback,
        feedback_email: feedback_email,
        feedback_location: feedback_location,
        location: location,
        
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
                feedback('');
            });
	}
    };
});