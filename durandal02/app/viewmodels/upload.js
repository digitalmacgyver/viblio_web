define( ['plugins/dialog','lib/viblio','lib/config','facebook'], function(dialog,viblio,config) {
    return {
	displayName: 'Media Upload',
	message: function() {
	    dialog.showMessage( 'This is a body', 'Title' );
	},
	testNewVideo: function() {
	    viblio.api( '/services/test/new_video_test' );
	},
	linkFacebookAccount: function() {
	    var fb_appid   = config.facebook_appid();
	    var fb_channel = config.facebook_channel();

	    if ( ! fb_appid ) {
		dialog.showMessage( 'In development, Facebook login will not work.' );
		return;
	    }

	    FB.init({
		appId: fb_appid,
		channelUrl: fb_channel,
		status: true,
		cookie: true,
		xfbml: true
	    });

	    FB.login(function(response) {
		if (response.authResponse) {
		    viblio.api( '/services/user/link_facebook_account',
				{ access_token: response.authResponse.accessToken }
			      ).then( function( json ) {
				  dialog.showMessage( 'Your Facebook account has been successfully linked!', 'Congradulations!' );
			      });
		}
	    },{scope: config.facebook_ask_features()});
	}
    };
});