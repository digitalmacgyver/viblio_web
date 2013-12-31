define( ['plugins/router', 'durandal/app', 'lib/viblio', 'lib/config', 'durandal/system'], function(router, app, viblio, config, system) {
    var feedback = ko.observable();
    var feedback_email = ko.observable( 'feedback@' + config.email_domain() );
    var feedback_location = function() {
        return window.location.hash;
    };
    var location = ko.observable();
    var browser = head.browser.name;
    var version = head.browser.version;
    var userAgent = navigator.userAgent;
    var browserWidth = head.screen.innerWidth;
    var browserHeight = head.screen.innerHeight;
    
    router.on('router:route:activating').then(function(instance, instruction, router){
        location(instruction.config.title);
    });
    
    return {
        feedback: feedback,
        feedback_email: feedback_email,
        feedback_location: feedback_location,
        location: location,
        browser: browser,
        version: version,
        userAgent: userAgent,
        browserWidth: browserWidth,
        browserHeight: browserHeight,
        
        send_feedback: function() {
            var args;
            args = {
                feedback: feedback() + ', browser: ' + browser + ', version: ' + version + ', userAgent: ' + userAgent + ', browserWidth: ' + browserWidth + ', browserHeight: ' + browserHeight,
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