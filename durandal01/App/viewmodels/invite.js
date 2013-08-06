define( ['durandal/plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'lib/dialogs', 'facebook'], function( router, app, system, config, viblio, dialogs ) {

    var rfullname = ko.observable();
    var remail = ko.observable();
    var rpassword1 = ko.observable();
    var rpassword2 = ko.observable();

    var ifullname = ko.observable();
    var iemail = ko.observable();
    var ipassword = ko.observable();
    var icode = ko.observable();

    function register() {
	dialogs.showMessage( 'A request has been sent' );
    }

    function invite() {
	dialogs.showMessage( 'Thanks!' );
    }

    return {
	
	rfullname: rfullname,
	remail: remail,
	rpassword1: rpassword1,
	rpassword2: rpassword2,

	ifullname: ifullname,
	iemail: iemail,
	ipassword: ipassword,
	icode: icode,
	
	register: register,
	invite: invite
    };
});
