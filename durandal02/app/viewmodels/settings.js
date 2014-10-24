define(['durandal/app','plugins/router','lib/viblio','lib/config','lib/customDialogs','plugins/dialog','facebook'],function(app,router,viblio,config,customDialogs,dialog) {
    var profile = ko.observable({});
    var email   = ko.observable();
    var displayname   = ko.observable('');
    var validDisplayname = ko.computed(function(){
        var regexp1=new RegExp('^[a-zA-Z0-9 .!?"-]+$');
        if ( !regexp1.test( displayname() ) || displayname().length > 32 ||  displayname()[0] == ' ' || displayname() == '' ) {
            return false;
        } else {
            return true;
        }
    });
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
	$.get( '/services/user/change_email_or_displayname', { email: addr } ).then(
	    function( json ) {
		if ( json.error ) {
		    customDialogs.showError( json.message );
		    email( profile().email );
		}
		viblio.mpEvent( 'change_email' );
	    });
    }

    function newDisplayname( name ) {
	$.get( '/services/user/change_email_or_displayname', { displayname: name } ).then(
	    function( json ) {
		if ( json.error ) {
		    customDialogs.showError( json.message );
		    displayname( profile().displayname );
		}
		else {
		    viblio.setUser( json.user );
		    viblio.mpEvent( 'change_displayname' );
		}
	    });
    }

    email.subscribe( function( v ) {
	if ( v != profile().email ) {
	    newEmail( v );
	}
    });

    displayname.subscribe( function( v ) {
        var regexp1=new RegExp('^[a-zA-Z0-9 .!?"-]+$');
        
        //v = escape(v);
	if ( v && profile().displayname && ( v != profile().displayname ) && validDisplayname() ) {
	    newDisplayname( v );
            profile().displayname = v;
	}
	/*if ( v ) 
	    profile().displayname = v;*/
    });

    function linkFacebookAccount() {
	var fb_appid   = config.facebook_appid();
	var fb_channel = config.facebook_channel();

	if ( ! fb_appid ) {
	    customDialogs.showMessage( 'In development, Facebook login will not work.' );
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
			      customDialogs.showMessage( 'Your Facebook account has been successfully linked!', 'Congratulations!' );
			      links().facebook = json.user.link;
			      linkedFacebook( true );
			      viblio.mpEvent( 'facebook_link' );
			  });
	    }
	},{scope: config.facebook_ask_features()});
    }

    function unlinkFacebookAccount() {
	viblio.api( '/services/user/unlink_facebook_account' ).then( function() {
	    linkedFacebook( false );
	    viblio.mpEvent( 'facebook_unlink' );
	    customDialogs.showMessage( 'Your Facebook account has been successfully disconnected.', 'Linked Accounts' );
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
	displayname: displayname,
        validDisplayname: validDisplayname,
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
	    customDialogs.showLoading();

	    viblio.api( '/services/user/change_profile', data ).then( function() {
		customDialogs.hideLoading();
	    });
	},
	cancel: function() {
            if( !validDisplayname() ) {
                if( displayname()[0] == ' ' ) {
                    app.showMessage('Your display name cannot start with an empty space.', 'Display Name Error');
                }
                if( displayname() == '' ) {
                    app.showMessage('Please enter a display name.', 'Display Name Error');
                }
                if( displayname().length > 32 ) {
                    app.showMessage('Your display must be fewer than 32 characters long.', 'Display Name Error');
                }
            } else {
                router.navigateBack();
            }
	},
                
	changeAvatar: function() {
	    //app.showDialog('viewmodels/avatar_upload');
	    customDialogs.showModal('viewmodels/avatar_upload');
	    viblio.mpEvent( 'avatar' );
	},        

	changePassword: function() {
	    customDialogs.showPassword();
	    viblio.mpEvent( 'change_password' );
	},
                
	activate: function( view ) {
	    var self = this;
	    self.view = view;
            
	    return viblio.api( '/services/user/profile' ).then( function( json ) {

		var p = { uuid: json.profile.uuid,
			  email: json.profile.email,
			  displayname: json.profile.displayname,
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
		displayname( json.profile.displayname );
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
	},
        
        compositionComplete: function(view) {
	    // jqueryFileUpload
	    $(view).find(".avatar").on( 'click', function() {
		$(view).find(".fileupload").click();
	    });
	    $(view).find(".fileupload").fileupload({
		dataType: 'json',
		start: function() {
		    $(".avatar div i").css( 'visibility', 'visible' );
		},
		done: function(e, data) {
		    /*$('<img class="newPic">').load( function() {
			$(".avatar img").replaceWith( $(this) );
			$(".avatar div i").css( 'visibility', 'hidden' );
		    }).attr( 'src', "/services/user/avatar?uid=-&y=120" );*/
                    console.log( e, data );
                    $(".bannerAvatar div i").css( 'visibility', 'hidden' );
                    $('.bannerAvatar img').attr( 'src', "/services/user/avatar?uid=-&x=120" );
		}
	    });
        }
        
    };
});
