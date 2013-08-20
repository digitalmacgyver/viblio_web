define(['plugins/router','lib/viblio','lib/config','plugins/dialog','facebook'],function(router,viblio,config,dialogs) {
    var profile = ko.observable({});
    var fields  = ko.observable({});
    var links   = ko.observable({});
    var showMoreEmailFields = ko.observable( false );
    var linkedFacebook = ko.observable( false );

    showMoreEmailFields.subscribe( function( v ) {
	fields().email_notifications = v;
    });

    function linkFacebookAccount() {
	var fb_appid   = config.facebook_appid();
	var fb_channel = config.facebook_channel();

	if ( ! fb_appid ) {
	    dialogs.showMessage( 'In development, Facebook login will not work.' );
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
			      dialogs.showMessage( 'Your Facebook account has been successfully linked!', 'Congradulations!' );
			      links().facebook = json.user.link;
			      linkedFacebook( true );
			  });
	    }
	},{scope: config.facebook_ask_features()});
    }

    function unlinkFacebookAccount() {
	viblio.api( '/services/user/unlink_facebook_account' ).then( function() {
	    linkedFacebook( false );
	    dialogs.showMessage( 'Your Facebook account has been successfully disconnected.', 'Linked Accounts' );
	});
    }

    function finterp( v ) {
	if ( v == "True" || v == "true" ) 
	    return true;
	if ( v == "False" || v == "false" )
	    return false;
	return v
    }

    return {
	profile: profile,
	fields: fields,
	links: links,
	showMoreEmailFields: showMoreEmailFields,
	linkedFacebook: linkedFacebook,
	linkAccount: function( provider ) {
	    if ( provider == 'facebook' ) {
		linkFacebookAccount();
	    }
	},
	unlinkAccount: function( provider ) {
	    if ( provider == 'facebook' ) {
		unlinkFacebookAccount();
	    }
	},
	save: function() {
	    // router.navigateBack();
	    var data = {};
	    Object.keys( fields() ).forEach( function( name ) {
		var value = fields()[name];
		data[name] = value;
	    });
	    viblio.api( '/services/user/change_profile', data ).then( function() {
		router.navigateBack();
	    });
	},
	cancel: function() {
	    router.navigateBack();
	},
	changeAvatar: function() {
	    dialogs.showAvatarUpload();
	},
	changePassword: function() {
	},
	attached: function( view ) {
	    return viblio.api( '/services/user/profile' ).then( function( json ) {
		
		var p = { uuid: json.profile.uuid,
			  email: json.profile.email,
			  fields: {},
			  links: {}
			};
		for( var i=0; i<json.profile.fields.length; i++ ) {
		    p.fields[json.profile.fields[i].name] = finterp( json.profile.fields[i].value );
		}
		for( var i=0; i<json.profile.links.length; i++ ) {
		    p.links[json.profile.links[i].provider] = json.profile.links[i].link;
		}
		profile( p );
		fields( p.fields );
		links( p.links );
		showMoreEmailFields( fields().email_notifications );
		linkedFacebook( links().facebook ? true : false );
	    });
	}
    };
});
