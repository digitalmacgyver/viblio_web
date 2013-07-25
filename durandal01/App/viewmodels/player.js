define( ['durandal/plugins/router','lib/dialogs','lib/config','lib/viblio','viewmodels/mediavstrip','purl'], function(router,dialogs,config,viblio,Strip) {
    // Extract any query params on the page.  Other parts
    // of the application can:
    //   router.navigateTo( '#/player?mid=' + mediafile.content().uuid );
    //
    function params() {
	var p = $.url(window.location.href.replace('/#','')).param();
	return p;
    }

    function should_simulate() {
	var videoel = document.createElement("video"),
	idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
	noflash = flashembed.getVersion()[0] === 0,
	simulate = !idevice && noflash &&
            !!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
	return simulate;
    }

    var query = ko.observable({});

    // Manage the fluid width of the main part of the
    // page.  The right side will remain fixed, 
    // and the main part will resize with browser.
    var el;
    function resize() {
	var r = $("#right-column").width();
	var w = $(window).width() - r - 40 -3;
	var o = $(el).find( "#main" );
	$("#main").width( w );
    }

    // Index of the next clip to play on nextRelated/previousRelated
    var next_available_clip = ko.observable( 0 );

    // Currently playing mediafile.  This is the JSON struct, not a view model
    var playing = ko.observable({});

    // This observable will contain the vstrip when it is
    // created in viewAttached.  Its a view model and is
    // composed into the main view.
    //
    var related = ko.observable();

    function playVid( m ) {
	flowplayer().play({
            url: 'mp4:amazons3/viblio-mediafiles/' + m.media().views.main.uri,
            ipadUrl: encodeURIComponent(m.media().views.main.url),
            // URL for sharing on FB, etc.
            pageUrl: config.site_server + '/shared/flowplayer/' + m.media().views.main.uuid,
            //scaling: 'fit',
            ratio: 9/16,
            //splash: true,
            provider: 'rtmp'
        });
    }

    function nextRelated() {
	console.log( 'play next related' );
	related().scrollTo( related().mediafiles()[ next_available_clip() ] );
	playVid( related().mediafiles()[ next_available_clip() ] );
	next_available_clip( next_available_clip() + 1 );
    }

    function previousRelated() {
	console.log( 'play previous related' );
    }

    function playRelated( m ) {
	var index = related().mediafiles.indexOf( m );
	next_available_clip( index + 1 );
	console.log( 'play this related: index:' + index );
	playVid( m );
    }

    return {
	query: query,
	playing: playing,
	related: related,
	previousRelated: previousRelated,
	nextRelated: nextRelated,
	activate: function( view ) {
	    // Resize the main window and install a handler
	    // to do it when the browser resizes.
	    el = view;
	    $(window).bind( 'resize', resize );
	    setTimeout( resize, 300 );
	},
	canDeactivate: function () {
	    // Remove the handler
	    $(window).unbind( 'resize', resize );
	    // Remove the player
	    flowplayer().unload();
	    return true;
	},
	viewAttached: function( view ) {
	    query( params() );
	    var mid = query().mid;

	    // We have a mediafile uuid as an argument to this
	    // page.  We *better* have, or I am not sure what to do!
	    //
	    if ( ! mid ) {
		return dialogs.showMessage( 'No video to play!' ).then( function() {
		    router.navigateTo( '#/welcome' );
		});
	    }

	    var promise = viblio.api( '/services/mediafile/get', { mid: mid } ).then( function( json ) {
		var mf = json.media;
		playing( mf );
		console.log( 'Going to play ' + mf.filename );

		// Get related vids
		var vstrip = new Strip( 'title', 'subtile' ).search();
		vstrip.on( 'mediavstrip:play', function( m ) {
		    console.log( 'vstrip: play: ' + m.media().uuid );
		    playRelated( m );
		});
		related( vstrip );

		// IF I DO NOT PUT THIS STATEMENT HERE BEFORE THE REAL ONE
		// THEN FP DOES NOT COME UP.  WHY!!!
		flowplayer( 'tv', "Vendor/flowplayer/flowplayer-3.2.16.swf" );

		$("#tv").flowplayer( "Vendor/flowplayer/flowplayer-3.2.16.swf", {
                    clip: {
                        url: 'mp4:amazons3/viblio-mediafiles/' + mf.views.main.uri,
                        ipadUrl: encodeURIComponent(mf.views.main.url),
                        // URL for sharing on FB, etc.
                        pageUrl: config.site_server + '/shared/flowplayer/' + mf.views.main.uuid,
                        //scaling: 'fit',
                        ratio: 9/16,
                        //splash: true,
                        provider: 'rtmp'
                    },
                    plugins: {
                        rtmp: {
                            url: 'Vendor/flowplayer/flowplayer.rtmp-3.2.12.swf',
                            netConnectionUrl: 'rtmp://ec2-54-214-160-185.us-west-2.compute.amazonaws.com/vods3'
                        },
                        viral: {
                            url: 'Vendor/flowplayer/flowplayer.viralvideos-3.2.13.swf',
                            share: { 
                                description: 'Video highlight by Viblio',
                                facebook: true,
                                twitter: true,
                                myspace: false,
                                livespaces: true,
                                digg: false,
                                orkut: false,
                                stumbleupon: false,
                                bebo: false
                            },
                            embed: false,
                            email: false
                        }
                    },
                    canvas: {
                        backgroundColor:'#254558',
                        backgroundGradient: [0.1, 0]
                    }
                }).flowplayer().ipad({simulateiDevice: should_simulate()});
	    });
	    return promise;
	}
    };
});

