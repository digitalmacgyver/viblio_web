define(['plugins/router','lib/viblio','lib/customDialogs','durandal/system', 'lib/config',], function( router, viblio, dialog, system, config ) {

    var email = ko.observable();
    var password = ko.observable("");
    var validPassword = ko.computed(function(){
        if ( password().length >= 6 ) {
            return true;
        } else {
            return false;
        }
    });
    var displayname = ko.observable();
    var validated = ko.computed( function() {
	return email() && password();
    });
    var media = ko.observable();
    var agreeTOS = ko.observable(false);
    var avatar = ko.observable(null);
    
    var isExistingUser = ko.observable(null);
    var viewingAlbum = ko.observable( null );
    var aid = ko.observable( null );
    
    fb_appid   = config.facebook_appid();
    fb_channel = config.facebook_channel();

    FB.init({
	appId: fb_appid,
	channelUrl: fb_channel,
	status: true,
	cookie: true,
	xfbml: true
    });

    var url;

    var labelShowHide = ko.observable( 'reveal' );

    var view;

    var correct = ko.observable( true );

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
	router.navigate( viblio.getLastAttempt() || url || 'home' );
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

    return {
	email: email,
	correct: correct,
	password: password,
        validPassword: validPassword,
	displayname: displayname,
	validated: validated,
        media: media,
        agreeTOS: agreeTOS,
	labelShowHide: labelShowHide,
        facebookAuthenticate: facebookAuthenticate,
	avatar: avatar,
        
        isExistingUser: isExistingUser,
        viewingAlbum: viewingAlbum,
        aid: aid,
        
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
            router.navigate('TOS?showTOS=true');
	},

	attached: function( el ) {
	    view = el;
	},

	canActivate: function( args ) {
	    // If the user is already logged in then, just send them directly to the 
            // album
	    if ( args && args.email && args.url ) {
		return system.defer( function( dfd ) {
		    viblio.api( '/services/na/valid_email', {email: args.email} ).then( function( json ) {
			if ( json.valid == 0 && json.why == 'email address taken' ) {
                            if( viblio.user() && viblio.user().email && viblio.user().email == args.email ) {
                                console.log( viblio.user() );
                                dfd.resolve({redirect: args.url});
                            } else {
                                dfd.resolve( true );
                            }
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
            console.log( 'register activate fired' );
	    var testing = 0;
            var albumArgs;
	    if ( args ) {
                if ( args.email ) {
                    email( args.email );
                }
                if ( args.url ) {
                    url = args.url;
                }
                if ( args.test ) {
                    testing = 1;
                }
                
                if ( args.email && args.url ) {
                    return viblio.api( '/services/na/valid_email', {email: args.email} ).then( function( json ) {
                        // they are an existing user
                        if ( json.valid == 0 && json.why == 'email address taken' ) {
                            isExistingUser( true );
                            email( args.email );
                            url = args.url;
                            // they are here to view album related stuff
                            if( url.indexOf('aid') != -1 ) {
                                viewingAlbum( true );
                                aid( url.slice( url.indexOf("=")+1 ) );
                                albumArgs = {
                                    email: email(),
                                    aid: aid()
                                };
                                viblio.api( 'services/na/find_share_info_for_album', albumArgs )
                                .then( function( json ) {
                                    media( json.album );
                                    if ( json.owner ) {
                                        displayname( json.owner.displayname );
                                        avatar( '/services/na/avatar?uid=' + json.owner.uuid + '&y=37' );
                                    }
                                })
                                // this will allow the error callback in newhome's albumVidsSearch() method
                                // to handle the error
                                .fail( function(xhr, status, data) {
                                    router.navigate( 'home?aid='+aid() );
                                });
                            } else {
                                viewingAlbum( false );
                            }
                        }
                        // they are not a user yet
                        else {
                            return viblio.api( 
                                '/services/na/find_share_info_for_pending',
                                { email: email(), test: testing } )
                            .then( function( json ) {
                                if ( json.owner ) {
                                    displayname( json.owner.displayname );
                                    avatar( '/services/na/avatar?uid=' + json.owner.uuid + '&y=37' );
                                }
                                else {
                                    displayname( 'Someone' );
                                    avatar( '/services/na/avatar?uid=' + '' + '&y=37' );
                                }
                                // We also have the mediafile (json.media ) and so
                                // could display the poster, et. al. here.
                                media( json.media );
                            });    
                        }
                    });
                }
	    }
	},
        
        nativeAuthenticate: function() {
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
        },

	done: function() {
	    viblio.api( '/services/na/new_user', { via: 'share',
						   email: email(),
						   password: password(),
						   displayname: email(),
                                                   creation_reason: 'private_share'
                                                 }, handleLoginFailure )
		.then( function( data ) {
		    // Save the logged in user info to the viblio object,
		    // which serves as a global exchange
		    //
		    viblio.setUser( data.user );
	
		    // mixpanel event

		    viblio.mpEvent( 'registered_via_share' );
		    viblio.mpEvent( 'login' );

		    router.navigate( viblio.getLastAttempt() || url || 'home' );
		});
	}
    };

});
