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
define( ['durandal/app','durandal/system','plugins/router','plugins/dialog','lib/config','lib/viblio','viewmodels/mediavstrip','viewmodels/face','modestmap'], function(app,system,router,dialog,config,viblio,Strip,Face,MM) {
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

    // Title and description - code to update/change is located in custom_bindings.js
    var title = ko.observable();
    var description = ko.observable();
    
    // Used to update the related video's title and description when the playing video is changed and also
    // occurs in the related video section
    app.on( "mediaFile:TitleDescChanged", function( data ) {
        var lookForId = data.mid;
        console.log( lookForId );
        console.log( $('#' + lookForId).children('.title').text() );
        if ( $(this).find('#' + lookForId) ) {
            $('#' + lookForId).find('.truncate').text( title() );
        }
        for(var i = 0; i < related().mediafiles().length; i++) {
            console.log( related().mediafiles()[i].media().title, related().mediafiles()[i].media().description );
            if ( related().mediafiles()[i].view.id == data.mid ) {
                console.log ("it's me!" + title() );
                related().mediafiles()[i].media().title = title();
                related().mediafiles()[i].media().description = description();
            }
        }; 
    });
    

    // holds the map
    var map = null;
    var locations = ko.observableArray([]);
    var isNear = ko.observable();

    // When new media files are added to the vstrip, as a result if
    // infinite scrolling for example, a new location will be added.
    // We subscribe to these events and manually add a marker to the
    // map.  Other techniques failed to work because at the time
    // this function is called the dom has not yet been updated.
    //
    locations.subscribe( function( v ) {
	var loc = v[v.length-1];
	if ( map ) {
	    el = $('<div class="marker"><i class="icon-play-sign"></i></div>');
	    el.data( 'location', loc );
	    map.addMarker( el.get(0) );
	}
    });

    // Extract and set up the faces
    var finfo = ko.observable();
    var faces = ko.observableArray([]);
    function setupFaces( m ) {
	faces.removeAll();
	if ( m.views.face && m.views.face.length ) {
	    var total = 0;
	    var ident = 0;

	    // Only do a max of four faces
	    var count = m.views.face.length;
	    if ( count > 4 ) count = 4;

	    for( var i=0; i<count; i++ ) {
		var face = m.views.face[i];
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
	    }
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
        playing( m.media() );
	title( playing().title || 'Click to add a title.' );
	description( playing().description || 'Click to add a description.' );
        
        console.log("From sidebar: " + m.media().uuid, playing().title, playing().description );
        
	setupFaces( m.media() );
	near( m.media() );
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

    // Extracts an address from the structure returned from
    // a call on the server to http://maps.googleapis.com
    //
    function getCountry(results)
    {
	return results[0].formatted_address;
	for (var i = 0; i < results[0].address_components.length; i++) {
            var shortname = results[0].address_components[i].short_name;
            var longname = results[0].address_components[i].long_name;
            var type = results[0].address_components[i].types;
            if (type.indexOf("country") != -1) {
		if (!isNullOrWhitespace(shortname)) {
                    return shortname;
		}
		else {
                    return longname;
		}
            }
	}
    }
    
    function isNullOrWhitespace(text) {
	if (text == null) {
            return true;
	}
	return text.replace(/\s/gi, '').length < 1;
    }

    // A new video is beling played.  Fetch its approx. location (string
    // address from http://maps.googleapis.com) and center/zoom to it on the
    // map.
    function near( m ) {
	if ( m.lat ) {
	    viblio.api( '/services/faces/location', { lat: m.lat, lng: m.lng } ).then( function( res ) {
		if ( res && res.length ) {
		    isNear( 'Near ' + getCountry( res ) );
		    map.centerZoom( m.lat.toString() + ',' + m.lng.toString(), 11 );
		}
		else {
		    isNear( 'Find in map: Coming soon' );
		    map.centerZoom( config.geoLocationOfVideoAnalytics, 11 );
		}
	    });
	}
	else {
	    isNear( 'Find in map: Coming soon' );
	    map.centerZoom( config.geoLocationOfVideoAnalytics, 11 )
	}
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
	locations: locations,
	isNear: isNear,
	faces: faces,
	related: related,
	previousRelated: previousRelated,
	nextRelated: nextRelated,
	disable_prev: disable_prev,
	disable_next: disable_next,
	activate: function( args ) {
	    // capture the query arguments
	    query(args);

	    if ( ! query() ) {
		router.navigate( '#/home' );
	    }

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

	    return system.defer( function( dfd ) {
		viblio.api( '/services/mediafile/get', { mid: mid, include_contact_info: 1 } ).then( function( json ) {
		    var mf = json.media;
		    // Set now playing
		    playing( mf );

		    //title( playing().title || 'Click to add a title.' );
		    //description( playing().description || 'Click to add a description.' );
		    setupFaces( mf );

		    if ( mf.lat )
			locations.push( mf.lat.toString() + ',' + mf.lng.toString() );

		    // Get related vids
		    var vstrip = new Strip( 'title', 'subtile' );

		    // Subscribe to new mediafiles being added to the vstrip, from
		    // infinite scrolling for example, and add new locations to the
		    // map.
		    vstrip.mediafiles.subscribe( function( mediafiles ) {
			var m = mediafiles[ mediafiles.length - 1];
			if ( m.media().lat ) {
			    // if it doesn't already exist
			    if ( locations.indexOf( m.media().lat.toString() + ',' + m.media().lng.toString() ) == -1 )
				locations.push( m.media().lat.toString() + ',' + m.media().lng.toString() );
			}
		    });

		    // This async routine is the long pole.  Let it do the promise() resolution to
		    // pause the system until we have all the data.
		    //
		    vstrip.search().then( function() {
			// Get all of the geo locations of the related media
			/* DONE ABOVE IN SUBSCRIBE CALLBACK TO HANDLE INFINITE SCROLL (WIP: WILL REMOVE SOON)
			vstrip.mediafiles().forEach( function( m ) {
			    if ( m.media().lat ) {
				console.log( m.media().lat.toString() + ',' + m.media().lng.toString() );
				locations.push( m.media().lat.toString() + ',' + m.media().lng.toString() );
			    }
			});
			*/
			dfd.resolve();
		    });
		    vstrip.on( 'mediavstrip:play', function( m ) {
			// When the user selects a related video to play, play it
			playRelated( m );
		    });
		    // make it observable for the composure
		    related( vstrip );
		});
	    }).promise();
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
            title( playing().title || 'Click to add a title.' );
            description( playing().description || 'Click to add a description.' );
            console.log("From home player: " + playing().uuid, playing().title, playing().description );
	    // Instanciate the main flowplayer
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

	    // create the map
	    map = $("#geo-map").htmapl({
		touch: true,
		mousewheel: true
	    });
	    // center/zoom to media file location
	    near( mf );
        }
    };
});

