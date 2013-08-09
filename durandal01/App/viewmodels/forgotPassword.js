define( ['durandal/plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'lib/dialogs', 'facebook'], function( router, app, system, config, viblio, dialogs ) {

    var forgetEmail = ko.observable();

    function send() {
	dialogs.showMessage( 'A request has been sent' );
    }

    function cancel() {
        router.navigateTo( '#/login' );
    }

    return {
	forgetEmail: forgetEmail,

	send: send,
	cancel: cancel
    };
});
