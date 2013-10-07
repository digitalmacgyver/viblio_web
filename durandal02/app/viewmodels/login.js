define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'plugins/http', 'knockout', 'facebook'], function( router, app, system, config, viblio, dialog, http, ko ) {

    var email = ko.observable();
    var email_entry_error = ko.observable( false );

    var password = ko.observable();
    var password_entry_error = ko.observable( false );

    var orsignup = ko.observable( false );

    var signup_email = ko.observable();
    var signup_pw1 = ko.observable();
    var signup_pw2 = ko.observable();
    var signup_displayname = ko.observable();
    var signup_valid = ko.computed( function() {
	return signup_email() &&
	    signup_pw1() && signup_pw2 && ( signup_pw1() == signup_pw2() ) &&
	    signup_displayname();
    });

    fb_appid   = config.facebook_appid();
    fb_channel = config.facebook_channel();

    FB.init({
	appId: fb_appid,
	channelUrl: fb_channel,
	status: true,
	cookie: true,
	xfbml: true
    });

    function loginSuccessful( user ) {
	// Save the logged in user info to the viblio object,
	// which serves as a global exchange
	//
	viblio.setUser( user );
	
	// either go to the personal channel page, or
	// do a pass thru to the page the user was
	// trying to get to.
	router.navigate( viblio.getLastAttempt() || '#/home' );
    };

    function nativeAuthenticate() {
	if ( ! email() ) {
	    dialog.showMessage( 'The email field is required.', 'Authentication' );
	    return;
	}
	if ( ! password() ) {
            if( $('#loginPassword').val() ) {
                password( $('#loginPassword').val() );
            } else {
                dialog.showMessage( 'The password field is required.', 'Authentication' );
                return;
            }
	}
        
	viblio.api( '/services/na/authenticate',
		    { email: email(),
		      password: password(),
		      realm: 'db' }
		  ).then( function( json ) {
		      loginSuccessful( json.user );
		  });
    };

    function facebookAuthenticate() {
	if ( ! fb_appid )
	    dialog.showMessage( 'In development, Facebook login will not work.' );

	FB.login(function(response) {
            if (response.authResponse) {
		viblio.api( '/services/na/authenticate',
			    { realm: 'facebook',
                              access_token: response.authResponse.accessToken }
			  ).then( function( json ) {
			      loginSuccessful( json.user );
			  });
	    }
	    else {
		dialog.showMessage( 'User cancelled?', 'Authentication' );
	    }
	},{scope: config.facebook_ask_features()});
    };
    
    // Valid email address is checked, if entered it will send a confirmation email to address
    // and if the confirmation email is clicked then the email address is submitted to mailchimp
    // list called "Viblio Beta Enrollment from Login Page"
    function betaEnroll() {
        if ( $('#mce-EMAIL').val() == "" ) {
            dialog.showMessage( 'The email field is required.', 'Authentication' );
	    return;
        };
        
        if ( ! $('#mce-EMAIL')[0].checkValidity() ) {
            dialog.showMessage( 'Please enter a valid email address.', 'Authentication' );
	    return;
        };
        
        register( $('#mc-signup') );
    };
    
    function register( $form ) {
        $.ajax({
            type: $form.attr('method'),
            url: $form.attr('action').replace('/post?', '/post-json?').concat('&c=?'),
            data: $form.serialize(),
            timeout: 5000, // Set timeout value, 5 seconds
            cache       : false,
            dataType    : 'jsonp',
            contentType: "application/json; charset=utf-8",
            error       : function(err) { alert("Could not connect to the registration server. Please try again later."); },
            success     : function(data) {
                if (data.result != "success") {
                    // Something went wrong, do something to notify the user. maybe alert(data.msg);
                    dialog.showMessage( data.msg, 'Authentication' );
                } else {
                    showBetaReservedModal();
                }
            }
        });
    };
    
    function showBetaReservedModal() {
        dialog.show('viewmodels/betaReserved');
    };

    function signup() {
	// The form is good, the values are good.
	//
	// Should probably pop a dialog with email/displayname and terms of
	// service, which can be confirmed/agreed to, after which we call
	// the new_user end point.  Then we either go home, or to lastAttempt.

	// Should probably call an endpoint to see if this account information
	// id valid ... email not already registered, displayname something
	// not objectionable, etc.  Maybe new_user does that.

	// This is the final step, after a new_user has succeeded.
	email( signup_email() );
	password( signup_pw1() );
	nativeAuthenticate();
    };

    return {
	email: email,
	email_entry_error: email_entry_error,

	password: password,
	password_entry_error: password_entry_error,

	orsignup: orsignup,

	signup_email: signup_email,
	signup_pw1: signup_pw1,
	signup_pw2: signup_pw2,
	signup_displayname: signup_displayname,
	signup_valid: signup_valid,
        
	nativeAuthenticate: nativeAuthenticate,
	facebookAuthenticate: facebookAuthenticate,
        betaEnroll: betaEnroll,
        register: register,
        showBetaReservedModal: showBetaReservedModal,
	signup: signup,

	activate: function( args ) {
	    if ( args && args.orsignup ) {
		this.orsignup( true );
	    }
	    else {
		this.orsignup( false );
	    }
	}
    };
});
