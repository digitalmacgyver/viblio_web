define(['plugins/router','lib/viblio','lib/customDialogs','durandal/system'], function( router, viblio, dialog, system ) {

    var email = ko.observable();
    var password = ko.observable();
    var displayname = ko.observable();
    var validated = ko.computed( function() {
	return email() && password();
    });

    var url;

    var labelShowHide = ko.observable( 'reveal' );

    var view;

    var correct = ko.observable( true );

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
	    msg += '<a href="/services/na/download_trayapp">VIBLIO APP</a>.  ';
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

    return {
	email: email,
	correct: correct,
	password: password,
	displayname: displayname,
	validated: validated,
	labelShowHide: labelShowHide,

	not_correct: function() {
	    email(null);
	    correct( false );
	},

	toggleShowHide: function() {
	    var t = $(view).find('input[name="password"]').attr( 'type' );
	    if ( t == 'password' ) {
		labelShowHide( 'obscure' );
		var t = $(view).find('input[name="password"]').attr( 'type', 'text' );
	    }
	    else {
		labelShowHide( 'reveal' );
		var t = $(view).find('input[name="password"]').attr( 'type', 'password' );
	    }
	},

	displayTerms: function() {
	},

	attached: function( el ) {
	    view = el;
	},

	canActivate: function( args ) {
	    // In the case when/if user has already registered and perhaps
	    // clicked on an old email link to this register page, lets bounce
	    // them to the url directly
	    if ( args && args.email && args.url ) {
		return system.defer( function( dfd ) {
		    viblio.api( '/services/na/valid_email', {email: args.email} ).then( function( json ) {
			if ( json.valid == 0 && json.why == 'email address taken' ) {
			    dfd.resolve({redirect: args.url});
			}
			else {
			    dfd.resolve( true );
			}
		    });
		}).promise();
	    }
	    else {
		return true;
	    }
	},

	activate: function( args ) {
	    if ( args ) {
		if ( args.email ) {
		    email( args.email );
		}
		if ( args.url ) {
		    url = args.url;
		}
	    }
	    return viblio.api( 
		'/services/na/find_share_info_for_pending',
		{ email: email() } ).then( function( json ) {
		    if ( json.owner ) {
			displayname( json.owner.displayname );
		    }
		    else {
			displayname( 'Someone' );
		    }
		    // We also have the mediafile (json.media ) and so
		    // could display the poster, et. al. here.
		});
	},

	done: function() {
	    viblio.api( '/services/na/new_user', { email: email(),
						   password: password(),
						   displayname: email() }, handleLoginFailure )
		.then( function() {
		    router.navigate( viblio.getLastAttempt() || url || 'home' );
		});
	}
    };

});
