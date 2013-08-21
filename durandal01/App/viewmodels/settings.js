define(['durandal/app','plugins/router','lib/viblio','lib/config','plugins/dialog','facebook'],function(app,router,viblio,config,dialog) {
    var profile = ko.observable({});
    var email   = ko.observable();
    var links   = ko.observable({});
    var linkedFacebook = ko.observable( false );

    var email_notifications = ko.observable();
    var email_comment = ko.observable();
    var email_upload  = ko.observable();
    var email_face    = ko.observable();
    var email_viblio  = ko.observable();

    /**
    var email_changes = ko.computed( function() {
	return email_notifications() || 
	    email_comment() ||
	    email_upload() ||
	    email_face() ||
	    email_viblio();
    });
    **/
    var email_changes = ko.observable( false );

    function newEmail( addr ) {
	$.get( '/services/user/change_email', { email: addr } ).then(
	    function( json ) {
		if ( json.error ) {
		    dialogs.showError( json.message );
		    email( profile().email );
		}
	    });
    }

    email.subscribe( function( v ) {
	if ( v != profile().email ) {
	    console.log( 'changing email from', profile().email, 'to', v );
	    newEmail( v );
	}
    });

    function linkFacebookAccount() {
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
			      links().facebook = json.user.link;
			      linkedFacebook( true );
			  });
	    }
	},{scope: config.facebook_ask_features()});
    }

    function unlinkFacebookAccount() {
	viblio.api( '/services/user/unlink_facebook_account' ).then( function() {
	    linkedFacebook( false );
	    dialog.showMessage( 'Your Facebook account has been successfully disconnected.', 'Linked Accounts' );
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
	email: email,
	links: links,
	linkedFacebook: linkedFacebook,

	email_notifications: email_notifications, 
	email_comment: email_comment, 
	email_upload: email_upload, 
	email_face: email_face,
	email_viblio: email_viblio,
	email_changes: email_changes,

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
	    var data = {
		email_notifications: email_notifications(),
		email_comment: email_comment(),
		email_upload: email_upload(),
		email_face: email_face(),
		email_viblio: email_viblio()
	    };
	    dialogs.showLoading();
	    viblio.api( '/services/user/change_profile', data ).then( function() {
		dialogs.hideLoading();
	    });
	},
	cancel: function() {
	    router.navigateBack();
	},
<<<<<<< HEAD
	changeAvatar: function() {
	    app.showDialog('viewmodels/avatar_upload');
	},
=======
>>>>>>> master
	changePassword: function() {
	    dialogs.showPassword();
	},
<<<<<<< HEAD
	attached: function( view ) {
=======
	viewAttached: function( view ) {
	    var self = this;
	    self.view = view;

	    // jqueryFileUpload
	    $(self.view).find("#fileupload").fileupload({
		dataType: 'json',
		start: function() {
		    $(self.view).find(".avatar div i").css( 'visibility', 'visible' );
		},
		done: function(e, data) {
		    //$(self.view).find("#apic").attr('src',"/services/user/avatar?uid=-&y=70");
		    $('<img>').load( function() {
			$(self.view).find(".avatar img").replaceWith( $(this) );
			$(self.view).find(".avatar div i").css( 'visibility', 'hidden' );
		    }).attr( 'src', "/services/user/avatar?uid=-&y=70" );
		}
	    });

	    dialogs.showLoading();
>>>>>>> master
	    return viblio.api( '/services/user/profile' ).then( function( json ) {
		dialogs.hideLoading();

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
		email( json.profile.email );
		links( p.links );

		email_notifications( p.fields.email_notifications );
		email_comment( p.fields.email_comment );
		email_upload( p.fields.email_upload );
		email_face( p.fields.email_face );
		email_viblio( p.fields.email_viblio );

		email_notifications.subscribe( function() { email_changes( true ); } );
		email_comment.subscribe( function() { email_changes( true ); } );
		email_upload.subscribe( function() { email_changes( true ); } );
		email_face.subscribe( function() { email_changes( true ); } );
		email_viblio.subscribe( function() { email_changes( true ); } );

		linkedFacebook( links().facebook ? true : false );
	    });
	}
    };
});
