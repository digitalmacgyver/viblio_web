define( ['durandal/app','durandal/system','plugins/router','lib/config','lib/viblio','lib/customDialogs','viewmodels/mediafile'], function( app,system,router,config,viblio,customDialogs,Mediafile) {

    function s3bucket( s3url ) {
        var host = $.url( s3url ).attr( 'host' );
        return host.split(".")[0];
    }

    function resizePlayer() {
        $(".player, .player video").height( ($(".player").width()*9) / 16 );
    }

    // Used by flowplayer, to decide if we're on a platform that
    // does not support flash but does support html5 video tag.
    // If that is the case, then flowplayer will be "simulated"
    // with the video tag, at some loss of functionality.
    function should_simulate() {
        var videoel = document.createElement("video"),
        idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
        noflash = flashembed.getVersion()[0] === 0,
        simulate = !idevice && noflash &&
            !!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
        return simulate;
    }

    // Currently playing mediafile.  This is the JSON struct, not a view model
    var playing = ko.observable();

    var title = ko.observable();
    var description = ko.observable();

    return {
	user: viblio.user,
	playing: playing,
        title: title,
        description: description,
	activate: function( args ) {
	    var mid = args.mid;
	    $(window).bind('resize', function() {
                resizePlayer();
            });
	    if ( ! mid ) {
                return dialog.showMessage( 'No video to play!' )
	    }
	    // Fetch mediafile via un-authenticated endpoint.  The mediafile
	    // being fetched must be marked somehow.  And we need to determine
	    // whether the person viewing this page is authenticated or not.
	    return system.defer( function( dfd ) {
		$.getJSON( '/services/user/me' ).then( function( res ) {
		    if ( res && res.error ) {
			// Not authenticated.  Might still be a viblio user,
			// but there is no browser session.
			viblio.setUser( null );
		    }
		    else {
			// Authenticated.  There was a valid browser session.
			viblio.setUser( res.user );
		    }
		    viblio.api( '/services/na/media_shared', 
				{ mid: mid, uid: viblio.getUser().uuid } ).then( function() {
				    var mf = json.media;
				    playing( new Mediafile( mf ) );
				    dfd.resolve({});
				});
		});
	    }).promise();
	},
	detached: function () {
            $(window).unbind( 'resizePlayer', resizePlayer );
            // Remove the player
            if(flowplayer()){
                flowplayer().unload();
            }
	},
	compositionComplete: function(view, parent) {
	    if ( playing() ) {
		var mf = playing().media();
		title( playing().media().title );
		description( playing().media().description );
		$(".player").flowplayer( { src: "lib/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' }, {
                    ratio: 9/16,
                    clip: {
			url: 'mp4:amazons3/' + s3bucket( mf.views.main.url ) + '/' + mf.views.main.uri,
			ipadUrl: encodeURIComponent(mf.views.main.url),
			// URL for sharing on FB, etc.
			pageUrl: config.site_server + '/shared/flowplayer/' + mf.views.main.uuid,
			scaling: 'fit',
			//ratio: 9/16,
			//splash: true,
			provider: 'rtmp'
                    },
                    plugins: {
			// Wowza stuff
			rtmp: {
                            url: 'lib/flowplayer/flowplayer.rtmp-3.2.12.swf',
                            netConnectionUrl: 'rtmp://ec2-54-214-160-185.us-west-2.compute.amazonaws.com/vods3'
			},
                    },
                    canvas: {
			backgroundColor:'#254558',
			backgroundGradient: [0.1, 0]
                    }
		}).flowplayer().ipad({simulateiDevice: should_simulate()});
		resizePlayer();
	    }
	}
    };
});
