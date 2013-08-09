define( ['durandal/plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'lib/dialogs', 'facebook'], function( router, app, system, config, viblio, dialogs ) {

    var email = ko.observable();
    var email_entry_error = ko.observable( false );

    var password = ko.observable();
    var password_entry_error = ko.observable( false );

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
	router.navigateTo( viblio.getLastAttempt() || '#/home' );
    }

    function nativeAuthenticate() {
	viblio.api( '/services/na/authenticate',
		    { email: email(),
		      password: password(),
		      realm: 'db' }
		  ).then( function( json ) {
		      loginSuccessful( json.user );
		  });
    }

    function facebookAuthenticate() {
	if ( ! fb_appid )
	    dialogs.showMessage( 'In development, Facebook login will not work.' );

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
		dialogs.showMessage( 'User cancelled?', 'Authentication' );
	    }
	},{scope: config.facebook_ask_features()});
    }

    return {
	email: email,
	email_entry_error: email_entry_error,

	password: password,
	password_entry_error: password_entry_error,
        
	nativeAuthenticate: nativeAuthenticate,
	facebookAuthenticate: facebookAuthenticate
    };
});
