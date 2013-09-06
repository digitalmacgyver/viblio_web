/*
  The player page.  Where we play user videos and show
  actors, related videos and other interesting metadata

  The way to play a video is to

  router.navigate( '#/player?mid=uuid' );

  Where uuid is a mediafile uuid.  The mediafile is
  actually fetched from the server to play.  We do it
  this way in case we use this page as a link to shared
  videos.
*/
define( ['durandal/app','plugins/router','plugins/dialog','lib/config','lib/viblio','viewmodels/mediavstrip','viewmodels/face'], function(app,router,dialog,config,viblio,Strip,Face) {
    // Given a S3 url, parse out and return the bucket name.  Needed for
    // Wowza urls.
    //
    function s3bucket( s3url ) {
	var host = $.url( s3url ).attr( 'host' );
	return host.split(".")[0];
    }

    function resizePlayer() {
	$("#tv, #tv video").height( ($("#tv").width()*9) / 16 );
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

    // Make the page query params observable (for the
    // heck of it, probably not required).
    var query = ko.observable({});

    // Index of the next clip to play on nextRelated/previousRelated
    var next_available_clip = ko.observable( 0 );

    // Currently playing mediafile.  This is the JSON struct, not a view model
    var playing = ko.observable({});

    // This observable will contain the vstrip when it is
    // created in attached.  Its a view model and is
    // composed into the main view.
    //
    var related = ko.observable();

    // Title and description
    var title = ko.observable();
    var description = ko.observable();

    // Extract and set up the faces
    var finfo = ko.observable();
    var faces = ko.observableArray([]);
    function setupFaces( m ) {
	faces.removeAll();
	if ( m.views.face && m.views.face.length ) {
	    var total = 0;
	    var ident = 0;
	    m.views.face.forEach( function( face ) {
		total += 1;
		var data = {
		    url: face.url,
		    appears_in: 1
		};
		if ( face.contact ) {
		    ident += 1;
		    data.contact_name = face.contact.contact_name;
		    data.id           = face.contact_id;
		}
		faces.push( new Face( data ) );
	    });
	    finfo( 'Starring (' + ident + '/' + total + ')' );
	}
	else {
	    finfo( 'No faces detected' );
	}
    }

    // Play a new video.  Used after the main player is created in
    // attached.  This reuses the player to play a different clip.
    //
    function playVid( m ) {
	title( m.media().title || 'Click to add a title.' );
	description( m.media().description || 'Click to add a description.' );
	setupFaces( m.media() );
	flowplayer().play({
            url: 'mp4:amazons3/' + s3bucket( m.media().views.main.url ) + '/' + m.media().views.main.uri,
            ipadUrl: encodeURIComponent(m.media().views.main.url),
            // URL for sharing on FB, etc.
            pageUrl: config.site_server + '/shared/flowplayer/' + m.media().views.main.uuid,
            //scaling: 'fit',
            //splash: true,
            provider: 'rtmp'
        });
	// push it onto history
	//router.navigate( '#/player?mid=' + m.media().uuid, false);
    }

    // Store the disable_prev/next as observables so
    // we can monkey with the buttons in the GUI
    var disable_prev = ko.observable( true );
    var disable_next = ko.observable( false );

    // Play next related video
    function nextRelated() {
	// We need to ask the vstrip if the next available clip is 
	// actually available.  
	if ( related().isClipAvailable( next_available_clip() ) ) {
	    disable_prev( false );
	    related().scrollTo( related().mediafiles()[ next_available_clip() ] );
	    playVid( related().mediafiles()[ next_available_clip() ] );
	    next_available_clip( next_available_clip() + 1 );
	    if ( ! related().isClipAvailable( next_available_clip() ) )
		 disable_next( true );
	}
	else {
	    disable_next( true );
	}
    }

    // Play previous related video
    function previousRelated() {
	var p = next_available_clip() - 2;
	if ( p < 0 ) {
	    disable_prev( true );
	}
	else {
	    if ( p == 0 ) {
		// We've transitioned to 0.  Play it but disable prev
		disable_prev( true );
	    }
	    next_available_clip( p );
	    related().scrollTo( related().mediafiles()[ next_available_clip() ] );
	    playVid( related().mediafiles()[ next_available_clip() ] );
	    next_available_clip( p + 1 );
	    disable_next( false );
	}
    }

    // User can directly select a related video and
    // play it.
    function playRelated( m ) {
	var index = related().mediafiles.indexOf( m );
	next_available_clip( index + 1 );
	console.log( 'play this related: index:' + index );
	playVid( m );
    }

    return {
        showShareVidModal: function() {
            app.showDialog('viewmodels/shareVidModal');
        },
	query: query,
	playing: playing,
	title: title,
	description: description,
	finfo: finfo,
	faces: faces,
	related: related,
	previousRelated: previousRelated,
	nextRelated: nextRelated,
	disable_prev: disable_prev,
	disable_next: disable_next,
	activate: function( args ) {
	    // capture the query arguments
	    query(args);
	    var mid = query().mid;

	    $(window).bind('resize', function() {
                resizePlayer();
            });

	    // Fetch the data we need from the server

	    // We have a mediafile uuid as an argument to this
	    // page.  We *better* have, or I am not sure what to do!
	    //
	    if ( ! mid ) {
		return dialog.showMessage( 'No video to play!' ).then( function() {
		    router.navigate( '#/home' );
		});
	    }

	    return viblio.api( '/services/mediafile/get', { mid: mid, include_contact_info: 1 } ).then( function( json ) {
		var mf = json.media;
		// Set now playing
		playing( mf );
	    });
	},
	canDeactivate: function () {
	    $(window).unbind( 'resizePlayer', resizePlayer );
	    // Remove the player
	    if(flowplayer()){
                flowplayer().unload();
            }
	    return true;
	},
        compositionComplete: function(view, parent) {
	    var mid = query().mid;
	    var mf = playing();

	    title( mf.title || 'Click to add a title.' );
	    description( mf.description || 'Click to add a description.' );
	    setupFaces( mf );

	    // Get related vids
	    var vstrip = new Strip( 'title', 'subtile' ).search();
	    vstrip.on( 'mediavstrip:play', function( m ) {
		// When the user selects a related video to play, play it
		playRelated( m );
	    });
	    // make it observable for the composure
	    related( vstrip );

	    // Instanciate the main flowplayer
	    console.log( 'Bucket: ' + s3bucket( mf.views.main.url ) );
	    $("#tv").flowplayer( { src: "lib/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' }, {
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
		    // Sharing stuff
                    viral: {
                        url: 'lib/flowplayer/flowplayer.viralvideos-3.2.13.swf',
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

	    resizePlayer();
        }
    };
});

