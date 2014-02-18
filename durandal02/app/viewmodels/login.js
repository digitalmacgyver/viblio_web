define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'lib/customDialogs', 'plugins/http', 'knockout', 'facebook'], function( router, app, system, config, viblio, dialog, http, ko ) {

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
	
	// mixpanel event
	viblio.mpEvent( 'login' );

	// either go to the personal channel page, or
	// do a pass thru to the page the user was
	// trying to get to.
        
        // getLastAttempt can be set to a funciton to run on login in order to do more than simply route to a specific hash
        if ( viblio.getLastAttempt() && typeof viblio.getLastAttempt() == 'function' ) {
            // if it's a function, run it
            viblio.getLastAttempt()();
        } else {
            // else route to hash or home
            router.navigate( viblio.getLastAttempt() || 'home' );
        }
    };

    function handleLoginFailure( json ) {
	var code = json.code;
	var msg  = json.detail;

	if ( code == "NOLOGIN_NOT_IN_BETA" ) {
	    msg  = "We are currently in an ivitation-only beta testing phase.  ";
	    msg += "If you would like to request participation in this beta testing program, ";
	    msg += "please enter your email below and click the reserver button.";
	}
	else if ( code == "NOLOGIN_BLACKLISTED" ) {
	    msg  = "We are very sorry but this email address is currently being blocked ";
	    msg += "from normal access.  If you feel this block should be removed, please ";
	    msg += "send email to <a href=\"mailto:xxx\">xxx</a>.";
	}
	else if ( code == "NOLOGIN_EMAIL_NOT_FOUND" ) {
	    msg  = "We do not have an account set up for " + email() + ".  If this is your ";
	    msg += "first time creating a Viblio account, start by downloading the ";
	    msg += '<a href="/#getApp?from=login">VIBLIO APP</a>.  ';
	    msg += "Otherwise, please re-enter the correct account information.";
	}
	else if ( code == "NOLOGIN_PASSWORD_MISMATCH" ) {
	    msg  = "The password you entered does not match the password we have on record for ";
	    msg += "this account.  Please try again, or click on the forgot password link.";
	}
	else if ( code == "NOLOGIN_NOEMAIL" ) {
	    msg  = "Please enter a valid email address to log in.";
	}
	else if ( code == "NOLOGIN_CANCEL" ) {
	    return;
	}
	else if ( code.match( /NOLOGIN_/g ) ) {
	    // msg is set to message coming back from server
	}
	else {
	    msg  = "We are very sorry, but something strange happened.  Please try ";
	    msg += "logging in again.";
	}
	return dialog.showMessage( msg, "Authentication Failure" );
    };

    function nativeAuthenticate() {
	if ( ! email() ) {
	    handleLoginFailure({ code: "NOLOGIN_NOEMAIL" });
	    return;
	}
	if ( ! password() ) {
            if( $('#loginPassword').val() ) {
                password( $('#loginPassword').val() );
            } else {
                handleLoginFailure({ code: "NOLOGIN_PASSWORD_MISMATCH" });
                return;
            }
	}
        
	viblio.api( '/services/na/authenticate',
		    { email: email(),
		      password: password(),
		      realm: 'db' },
		    handleLoginFailure
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
                              access_token: response.authResponse.accessToken },
			    handleLoginFailure
			  ).then( function( json ) {
			      loginSuccessful( json.user );
			  });
	    }
	},{scope: config.facebook_ask_features()});
    };
    
    // Valid email address is checked, if entered it will send a confirmation email to address
    // and if the confirmation email is clicked then the email address is submitted to mailchimp
    // list called "Viblio Beta Enrollment from Login Page"
    function betaEnroll() {
        if ( $('#mce-EMAIL').val() == "" ) {
	    handleLoginFailure({code: "NOLOGIN_NOEMAIL"});
	    return;
        };
        
        if ( ! $('#mce-EMAIL')[0].checkValidity() ) {
            handleLoginFailure({code: "NOLOGIN_NOEMAIL"});
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
                    dialog.showMessage( data.msg, 'Beta Signup' );
                } else {
		    viblio.mpEvent( 'register_for_beta' );
                    showBetaReservedModal();
                }
            }
        });
    };
    
    function showBetaReservedModal() {
        dialog.showModal('viewmodels/betaReserved');
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

	download_viblio: function() {
	    viblio.mpEvent( 'download_viblio' );
	    return true;
	},

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
