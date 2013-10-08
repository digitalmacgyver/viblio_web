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
    var showMessage = ko.observable( true );

    var showError = ko.observable( false );
    var errorMessage = ko.observable();
    var errorDetail = ko.observable();

    function errorHandler( data ) {
	errorMessage( data.message );
	errorDetail( data.detail );
	showError( true );
    }

    return {
	user: viblio.user,
	playing: playing,
        title: title,
        description: description,
	showMessage: showMessage,
	showError: showError,
	errorMessage: errorMessage,
	errorDetail: errorDetail,
	activate: function( args ) {
	    this.mid = args.mid;
	    $(window).bind('resize', function() {
                resizePlayer();
            });
	},
	detached: function () {
            $(window).unbind( 'resizePlayer', resizePlayer );
            // Remove the player
            if(flowplayer()){
                flowplayer().unload();
            }
	},
	compositionComplete: function(view, parent) {
	    var self = this;
	    if ( ! this.mid ) {
		return;
	    }
		viblio.api( '/services/na/media_shared', { mid: self.mid }, errorHandler ).then( function(json) {
		    if ( json.auth_required ) {
			// This is a private share and you are not logged in.
			viblio.setLastAttempt( '#/web_player?mid=' + self.mid );
			router.navigate( '#/login?orsignup=true' );
		    }
		    else {
			var mf = json.media;
			playing( new Mediafile( mf ) );
			if ( playing() ) {
			    var mf = playing().media();
			    title( playing().media().title );
			    description( playing().media().description );
			    self.showMessage( false );
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
		});
	}
    };
});
