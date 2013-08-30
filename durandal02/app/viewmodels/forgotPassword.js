define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {

    var forgetEmail = ko.observable();

    function send() {
	dialog.showMessage( 'A request has been sent' );
    }

    function cancel() {
        router.navigate( '#/login' );
    }

    return {
	forgetEmail: forgetEmail,

	send: send,
	cancel: cancel
    };
});
