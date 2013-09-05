define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {

    var forgetEmail = ko.observable();
    var forgetEmailIsValid = ko.observable(false);
    
    forgetEmail.subscribe( function() {
        if ( $('#forgetEmail')[0].checkValidity() ) {
          forgetEmailIsValid( true );
        } else {
          forgetEmailIsValid( false );
        }
    });

    function send() {
	dialog.showMessage( 'A request has been sent. Please check your email shortly.' );
    }

    function cancel() {
        router.navigate( '#/login' );
    }

    return {
	forgetEmail: forgetEmail,
        forgetEmailIsValid: forgetEmailIsValid,
        send: send,
	cancel: cancel
    };
});
