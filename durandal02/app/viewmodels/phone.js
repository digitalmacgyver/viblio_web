define(["durandal/app",
	"durandal/system",
	"plugins/router",
	"lib/config",
	"lib/viblio",
	"lib/customDialogs",
        'plugins/dialog',
        "viewmodels/addVideoModal"],
function(app,system,router,config,viblio,customDialogs,dialog,AddVideoModal) {
    var width = ko.observable();
    var height  = ko.observable();
    var poster  = ko.observable();
    var src  = ko.observable();
    var mid = ko.observable();
    var oniOS = ko.observable( head.browser.ios );
    var showEmail = ko.observable( false );
    var email = ko.observable();
    var emailValid = ko.computed (function() {
        if ( email() && $('.email')[0].checkValidity() ) {
            return true;
        } else {
            return false;
        }
    });
    var showSuccess = ko.observable( false );
    var player, mf;
    var loggedIn = ko.computed( function() {
        if( viblio.user ) {
            return true;
        } else {
            return false;
        }
    });

    function resizePlayer() {
	var width = $(window).width();
	var height = ( width * 9 ) / 16;
	var top = 6;
	if ( height > $(window).height() ) {
	    height = $(window).height();
	    width  = (height * 16)/9;
	    //top = 0;
	}
	/*else {
	    top = ($(window).height() - height) / 2;
	}*/
        
	$("#videojs").css( 'width', width + 'px' );
	$("#videojs").css( 'height', height + 'px' );
	$("#videojs").css( 'top', '6px' );
	$(".videocontent").height( $(window).height() );

	/*$("#m1").width( $(window).width() );
	$("#m1").height( $(window).height() );*/
    }
    
    function getiOSApp() {
        window.open( 'https://itunes.apple.com/us/app/viblio/id883377114?mt=8' );
    }
    
    function showEmailEntry() {
        showEmail( true );
    }
    
    function addVideo() {
        var args = {
            email: email(),
            mid: mid()
        };
        viblio.api( 'services/na/add_video_to_email', args ).then( function( res ) {
            if( res ) {
                showEmail( false );
                showSuccess( true );
            }
        });
    };

    return {
	width: width,
	height: height,
	poster: poster,
	src: src,
        oniOS: oniOS,
        showEmail: showEmail,
        email: email,
        emailValid: emailValid,
        showSuccess: showSuccess,
        loggedIn: loggedIn,
        
        showEmailEntry: showEmailEntry,
        
        getiOSApp: getiOSApp,
        addVideo: addVideo,
	canActivate: function( args ) {
	    if ( args && args.mid ) {
		return system.defer( function( dfd ) {
		    viblio.setLastAttempt( 'phone?mid=' + args.mid );
		    viblio.api( '/services/na/media_shared', args, function( error ) {
			customDialogs.showWebPlayerError( "We're Sorry", error.message, error );
			dfd.resolve(false);
		    } ).then( function( data ) {
			if ( data.auth_required ) {
			    dfd.resolve({redirect:'login'});
			}
			else {
			    mf = data.media;
                            mid( mf.uuid );
			    width( head.screen.width );
			    height( head.screen.height );
			    poster( mf.views.poster.url );
			    //poster( config.site_server + '/s/ip/' + mf.views.poster.uri );
			    src( mf.views.main.url );
			    viblio.mpEvent( 'mobile_share_view' );
			    
			    dfd.resolve( true );
			}
		    } );
		}).promise();
	    }
	    else {
		customDialogs.showMessage( 'Navigating to this page requires an argument.', 'Navigation Error' );
		return false;
	    }
	},
        
        attached: function() {
            $(window).on( 'resize.phone', resizePlayer );
        },

        detached: function() {
            $(window).off( '.phone' );
            if(flowplayer()){
                flowplayer().unload();
            }
        },

	compositionComplete: function() {
	    var self = this;

            oniOS( head.browser.ios ? true : false );
            
	    player = $("#videojs");
	    /*player.on( 'ended', function() {
		$("#videojs").css( 'display', 'none' );
		$("#m1").width( $(window).width() );
		$("#m1").height( $(window).height() );
		$("#m1").css( 'display', 'block' );
	    });*/
            player.on( 'loadstart', function() {
                viblio.mpEvent( 'play', { action: 'play', video_uuid: mf.uuid, viewer_uuid: viblio.user() ? viblio.user().uuid : "Not_Logged_In" } );
	    });
	    resizePlayer();
	    document.getElementById('videojs').setAttribute('poster', mf.views.poster.url );
	},

	/*close: function() {
	    $("#m1").css( 'display', 'none' );
	    $("#videojs").css( 'display', 'inline-block' );
	}*/
    };
});
