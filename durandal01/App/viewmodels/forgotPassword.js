define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialogs ) {

    var forgetEmail = ko.observable();

    function send() {
	dialogs.showMessage( 'A request has been sent' );
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
