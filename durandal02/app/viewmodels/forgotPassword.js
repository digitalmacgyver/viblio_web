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
        viblio.api( '/services/na/forgot_password_request', { email: forgetEmail().toLowerCase() } ).always(
            function( data ) {
                system.log( data );
                if( data.error ) {
                    system.log('there was an error!');
                    // code to disable the viblio API error called out in viblio.js
                };
                dialog.showMessage( 'A request has been sent. Please check your email shortly.', 'Thanks!' ).then(function() {
                    router.navigate( '#/login' );
                });
            });
    };

    function cancel() {
        router.navigate( '#/login' );
    };

    return {
	forgetEmail: forgetEmail,
        forgetEmailIsValid: forgetEmailIsValid,
        send: send,
	cancel: cancel
    };
});
