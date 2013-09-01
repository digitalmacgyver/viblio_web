define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {

    var rfullname = ko.observable();
    var remail = ko.observable();
    var rpassword1 = ko.observable();
    var rpassword2 = ko.observable();

    var ifullname = ko.observable();
    var iemail = ko.observable();
    var ipassword = ko.observable();
    var icode = ko.observable();

    function register() {viblio.api( '/services/na/invite_request',
        { email: remail, password: rpassword2, username: rfullname } ).then( function() {
           dialog.showMessage( 'An invite request has been sent via email to ' + remail() + '. Thanks!' );
        });
    }

    function invite() {
	viblio.api( '/services/na/new_user',
        { email: iemail, password: ipassword, username: ifullname, code: icode } ).then(function(json) {
          var user = json.user;
          viblio.setUser( user );
          dialog.showMessage( 'Thanks!' );
          router.navigate( '#/home' );
       });
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