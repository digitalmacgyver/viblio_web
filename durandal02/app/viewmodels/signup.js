define( ['plugins/router', 
	 'durandal/app', 
	 'durandal/system', 
	 'lib/config', 
	 'lib/viblio', 
	 'lib/customDialogs', 
	 'facebook'], 
function( router, app, system, config, viblio, dialog ) {

    var signup_email = ko.observable();
    var signup_pw1 = ko.observable();
    var signup_pw2 = ko.observable();
    var signup_displayname = ko.observable();
    var signup_valid = ko.computed( function() {
	return signup_email() &&
	    signup_pw1() && signup_pw2 && ( signup_pw1() == signup_pw2() ) &&
	    signup_displayname();
    });

    var fb_appid   = config.facebook_appid();
    var fb_channel = config.facebook_channel();

    FB.init({
	appId: fb_appid,
	channelUrl: fb_channel,
	status: true,
	cookie: true,
	xfbml: true
    });

    function loginSuccessful( user, via ) {
	// Save the logged in user info to the viblio object,
	// which serves as a global exchange
	//
	viblio.setUser( user );
	
	// mixpanel event
	viblio.mpEvent( via );

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
	    msg  = "We are currently in an invitation-only beta testing phase.  ";
	    msg += "If you would like to request participation in this beta testing program, ";
	    msg += "please enter your email below and click the reserve button.";
	}
	else if ( code == "NOLOGIN_BLACKLISTED" ) {
	    msg  = "We are very sorry but this email address is currently being blocked ";
	    msg += "from normal access.  If you feel this block should be removed, please ";
	    msg += "send email to <a href=\"mailto:xxx\">xxx</a>.";
	}
	else if ( code == "NOLOGIN_EMAIL_NOT_FOUND" ) {
	    /*msg  = "We do not have an account set up for " + email() + ".  If this is your ";
	    msg += "first time creating a Viblio account, start by downloading the ";
	    msg += '<a href="/services/na/download_trayapp">VIBLIO APP</a>.  ';
	    msg += "Otherwise, please re-enter the correct account information.";*/
            msg  = "Your email or password was entered incorrectly. If this is ";
	    msg += "your first time creating a VIBLIO account, register for our Beta below.";
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
	return dialog.showModal( 'viewmodels/customBlankModal', msg );
    };

    function facebookSignup() {
	if ( ! fb_appid )
	    dialog.showMessage( 'In development, Facebook login will not work.' );

	FB.login(function(response) {
            if (response.authResponse) {
		viblio.api( '/services/na/new_user', { via: 'facebook',
						       realm: 'facebook',
						       access_token: response.authResponse.accessToken },
			    handleLoginFailure )
		    .then( function( data ) {
			loginSuccessful( data.user, 'signup_via_facebook' );
		    });
	    }
	},{scope: config.facebook_ask_features()});
    };
    
    function nativeSignup() {
	viblio.api( '/services/na/new_user', { via: 'native',
					       realm: 'db',
                                               email: signup_email(),
                                               password: signup_pw1(),
                                               displayname: signup_displayname() }, handleLoginFailure )
            .then( function( data ) {
		loginSuccessful( data.user, 'signup_via_native' );
            });
    };

    return {
	signup_email: signup_email,
	signup_pw1: signup_pw1,
	signup_pw2: signup_pw2,
	signup_displayname: signup_displayname,
	signup_valid: signup_valid,
        
	nativeSignup: nativeSignup,
	facebookSignup: facebookSignup,

    };
});
