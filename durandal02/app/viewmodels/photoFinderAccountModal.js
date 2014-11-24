define( ['plugins/router',
         'lib/config',
         'lib/viblio',
         'lib/customDialogs',
         'plugins/dialog',], 
     
function( router, config, viblio, customDialogs, dialog ) {
    var M = function() {
        var self = this;
        
        self.email = ko.observable();
        self.email_entry_error = ko.observable( false );

        fb_appid   = config.facebook_appid();
        fb_channel = config.facebook_channel();
        
        // this will ensure that there is no active FB session so no errors are thrown when running FB.init()
        FB._initialized = false;
        FB.init({
            appId: fb_appid,
            channelUrl: fb_channel,
            status: true,
            cookie: true,
            xfbml: true
        });
    };
    
    M.prototype.closeModal = function( data ) {
        console.log( M.prototype, this );
        dialog.close( this, data );
    };
    
    // this will send an email to notifications@viblio.com and close the modal once it's completed
    M.prototype.sendEmail = function( user ) {
        var self = this;
        
        $.ajax({
            url: '/services/na/emailer',
            method: 'POST',
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify({
                subject: "New 'Try Photo Finder' user registration",
                to: [{ email: 'notifications@viblio.com', name: 'Notifications' }],
                body: '<p>We have a new user via the "Try Photo Finder" feature.  The email is: ' + user.email + '</p>'
            })
        }).then( function() {
            self.closeModal( user );
        });
    };
    
    M.prototype.loginSuccessful = function( user ) {
        var self = this;
	// Save the logged in user info to the viblio object,
	// which serves as a global exchange
	//
	viblio.setUser( user );
	
	// mixpanel event
	viblio.mpEvent( 'Signed up via "Try Photo Finder"' );
        
        // send email to notifications@viblio.com
        self.sendEmail( user );
    };

    M.prototype.handleLoginFailure = function( json ) {
        console.log( json );
        var self = this;
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
            msg  = "We do not have an account for the credentials you entered. ";
            msg += "If you don't have a VIBLIO account yet, "
            msg += "<a class='tomatoFont' id='ksLoginLink' href='/#ks_signup'>get on it</a>! ";
            msg += "Otherwise, re-enter the correct account information.";
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
        else if ( code = "NOLOGIN_EMAIL_TAKEN" ) {
            msg  = "There is already an account for this email. ";
            var lnk = "<a class='tomatoFont closeParent' href='/#login'>Login</a>"
            msg += lnk + " to your account to upload your video.";
        }
	else if ( code.match( /NOLOGIN_/g ) ) {
	    // msg is set to message coming back from server
	}
	else {
	    msg  = "We are very sorry, but something strange happened.  Please try ";
	    msg += "logging in again.";
	}
        
        var args = {
            msg: msg,
            parent: self
        };
	return customDialogs.showModal( 'viewmodels/customBlankModal', args );
    };

    M.prototype.nativeAuthenticate = function() {
        var self = this;
        
	if ( !self.email() ) {
	    self.handleLoginFailure({ code: "NOLOGIN_NOEMAIL" });
	    return;
	}
        
        var args = {
            email: self.email()
        };
        
        viblio.api( 'services/na/new_user_no_password', args, function(res){
                                                                self.handleLoginFailure(res);
                                                              } 
            ).then( function( data ) {
            console.log( data );
            self.loginSuccessful( data.user );
        });
    };

    M.prototype.facebookAuthenticate = function() {
        var self = this;
        
	if ( ! fb_appid )
	    dialog.showMessage( 'In development, Facebook login will not work.' );
        
        console.log( "FB._initialized: ", FB._initialized );

	FB.login(function(response) {
            if (response.authResponse) {
		viblio.api( '/services/na/authenticate',
			    { realm: 'facebook',
                              access_token: response.authResponse.accessToken,
                              try_photos: 1
                            },
                          function(res){
                            self.handleLoginFailure(res);
                          }
			  ).then( function( json ) {
                              console.log( "self from within facebookAuthenticate: ", self );
			      self.loginSuccessful( json.user );
			  });
	    }
	},{scope: config.facebook_ask_features()});
    };

    return M;
});
