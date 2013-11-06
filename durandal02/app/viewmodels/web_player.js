define( ['durandal/app','durandal/system','plugins/router','lib/config','lib/viblio','lib/customDialogs','viewmodels/mediafile','viewmodels/mediavstrip','viewmodels/face',], function( app,system,router,config,viblio,customDialogs,Mediafile,Strip,Face) {

    function s3bucket( s3url ) {
        var host = $.url( s3url ).attr( 'host' );
        return host.split(".")[0];
    }

    function resizePlayer() {
        $(".player, .player video").height( ($(".player").width()*9) / 16 );
    }
    
    function relatedVidHeight() {
        if( showRelated()) {
            var newHeight = $('#playerCommentsNavTable').height() + 18;
        
            $('#related-videos-block').find('.vstrip .media-container').css( 'height', newHeight );
            vstrip.updateScroller();
        }
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
    
    var user = viblio.user;
    
    // Make the page query params observable (for the
    // heck of it, probably not required).
    var query = ko.observable({});

    // Index of the next clip to play on nextRelated/previousRelated
    var next_available_clip = ko.observable( 0 );

    // Currently playing mediafile.  This is the JSON struct, not a view model
    var playing = ko.observable();
    
    var vstrip;
    
    // This observable will contain the vstrip when it is
    // created in attached.  Its a view model and is
    // composed into the main view.
    //
    var related = ko.observable();
    
    var showPlayerOverlay = ko.observable(false);
    
    function hidePlayerOverlay() {
        showPlayerOverlay(false);
    }
    
    var playingMid = ko.observable();
    
    function playAgain() {
        console.log('playAgain clicked!');
        flowplayer().play({
            url: 'mp4:' + playingMid().media().views.main.cf_url,
            ipadUrl: encodeURIComponent(playingMid().media().views.main.url)
        });
        //playing( new Mediafile( playingMid() ) );
    }
    
    var eyes = ko.observable();
    var title = ko.observable();
    var description = ko.observable();
    var showMessage = ko.observable( true );

    var showError = ko.observable( false );
    var errorMessage = ko.observable();
    var errorDetail = ko.observable();
    
    var shareType = ko.observable();
    var loggedIn = ko.computed(function(){
        if( user ) {
            return true;
        } else {
            return false;
        }
    });
    var showRelated = ko.computed(function(){
        if( loggedIn() && shareType() != 'public' ) {
            return true;
        } else {
            return false;
        }
    });
    
    // Comments associated with currently playing video
    var comments = ko.observableArray([]);
    var numComments = 0;
    comments.subscribe(function () {
        if( comments().length != 0 ) {
            if(comments().length == numComments) {
                relatedVidHeight();
            }
        } else {
            setTimeout(function() {
                relatedVidHeight();
            }, 300);
        }    
    });
    // The user comment
    var usercomment = ko.observable('');
    
    // Currently playing video location status
    var nolocation = ko.observable( true );

    function errorHandler( data ) {
	errorMessage( data.message );
	errorDetail( data.detail );
	showError( true );
    }
    
    // holds the map
    var map = null;
    var isNear = ko.observable();

    // Show the difference between to dates in a nice way
    function prettyWhen( n, d ) {
	if (( n - d ) == 0) return "now";
	var seconds = Math.floor( ( n - d ) / 1000 );
	if ( seconds < 1 ) return "now";
	if ( seconds < 2 ) return "1 second ago";
	if ( seconds < 60 ) return seconds + ' seconds ago';
	var minutes = Math.floor( seconds / 60 );
	if ( minutes <= 1 ) return "1 minute ago";
	if ( minutes < 60 ) return minutes + ' minutes ago';
	var hours = Math.floor( minutes / 60 );
	if ( hours <= 1 ) return 'an hour ago';
	if ( hours < 24 ) return hours + ' hours ago';
	var days = Math.floor( hours / 24 );
	if ( days <= 1 ) return 'a day ago';
	if ( days < 30 ) return days + ' days ago';
	var months = Math.floor( days / 30 );
	if ( months <= 1 ) return 'a month ago';
	if ( months < 12 ) return months + ' months ago';
	var years = Math.floor( months / 12 );
	if ( years <= 1 ) return 'a year ago';
	return years + ' years ago';
    }

    // Get the comments
    function setupComments( m ) {
	comments.removeAll();
	viblio.api( '/services/mediafile/comments', { mid: m.uuid } ).then( function( data ) {
	    if ( data.comments && data.comments.length ) {
                numComments = data.comments.length;
		var now = new Date();
		data.comments.forEach( function( c ) {
		    var hash = { comment: c.comment };
		    hash['who'] = c.who || 'anonymous'; 
		    hash['when'] = prettyWhen( now, new Date( c.created_date + ' GMT' ) );
		    comments.push( hash );
		});
            }
        });
    }
    
    // Extract and set up the faces
    var finfo = ko.observable();
    var faces = ko.observableArray([]);
    function setupFaces( m ) {
	viblio.api( '/services/faces/faces_in_mediafile', { mid: m.uuid } ).then( function( data ) {
	    faces.removeAll();
	    if ( data.faces && data.faces.length ) {
		var total = 0, ident = 0,
		count = data.faces.length;
		if ( count > 4 ) count = 4;  // Only do at most four faces
		
		for( var i=0; i<count; i++ ) {
		    var face = data.faces[i];
		    total += 1;
		    var F = {
			url: face.url,
			appears_in: 1,
			contact_name: null,
			contact_email: null
		    };
		    if ( face.contact ) {
			ident += 1;
			F.contact_name = face.contact.contact_name;
			F.contact_email = face.contact.contact_email;
			F.id = face.contact.contact_id;
			F.uuid = face.contact.uuid;
		    }
                    if (shareType() == 'private') {
                        faces.push( new Face( F, { allow_changes: false, show_name: true, selectable: false } ) );
                    } else {
                        faces.push( new Face( F, { allow_changes: false, show_name: false, selectable: false } ) );
                    }
		}
		finfo( 'Starring' );
	    }
	    else {
		finfo( '' );
	    }
	});
    }
    
    // Play a new video.  Used after the main player is created in
    // attached.  This reuses the player to play a different clip.
    //
    function playVid( m ) {
        playing( m );
        playingMid( m );
	title( playing().title() || 'Click to add a title.' );
	description( playing().description() || 'Click to add a description.' );
        setupComments( m.media() );
	setupFaces( m.media() );
	near( m.media() );
	flowplayer().play({
	    url: 'mp4:' + m.media().views.main.cf_url,
	    ipadUrl: encodeURIComponent(m.media().views.main.url)
        });
	viblio.mpEvent( 'related_video' );
	// push it onto history
	//router.navigate( 'player?mid=' + m.media().uuid, false);
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
	map.removeAllMarkers();
        if ( shareType() && shareType() != 'public') {
            // map.disableSetLocation(); 
            if ( m.lat ) {
                viblio.api( '/services/geo/location', { lat: m.lat, lng: m.lng } ).then( function( res ) {
                    if ( res && res.length ) {
                        nolocation( false );
                        isNear( "Near " + getCountry( res ) );
                        map.addMarker( m.lat, m.lng, m, true );
                    }
                    else {
                        isNear( 'This video\'s location cannot be found.' );
                        // comingSoon(m);
                        nolocation( true );
                    }
                });
            }
            else {
                isNear( 'This video\'s location has not been provided.' );
                // comingSoon(m);
                nolocation( true );
            }
        } else {
            isNear( 'Location has been hidden.' );
            map.centerDefault();
        }
	
    }

    // This gets triggered when a new user comment has been entered.
    //
    app.on( 'player:newcomment', function( data ) {
	viblio.api( '/services/mediafile/add_comment',
		    { mid: playing().media().uuid,
		      txt: usercomment(),
		    } ).then( function( json ) {
			usercomment('');
			var c = json.comment;
			var hash = { comment: c.comment };
			hash['who'] = c.who || 'anonymous'; 
			hash['when'] = prettyWhen( new Date(), new Date() );
			comments.unshift( hash );
			viblio.mpEvent( 'comment' );
		    });
    });
    
    return {
        relatedVidHeight: relatedVidHeight,
	user: user,
        query: query,
        next_available_clip: next_available_clip,
        vstrip: vstrip,
        showPlayerOverlay: showPlayerOverlay,
        hidePlayerOverlay: hidePlayerOverlay,
        playingMid: playingMid,
        playAgain: playAgain,
        related: related,
        loggedIn: loggedIn,
        showRelated: showRelated,
        disable_prev: disable_prev,
        disable_next: disable_next,
        nextRelated: nextRelated,
        previousRelated: previousRelated,
        playRelated: playRelated,
	playing: playing,
        eyes: eyes,
        title: title,
        description: description,
	showMessage: showMessage,
	showError: showError,
	errorMessage: errorMessage,
	errorDetail: errorDetail,
        shareType: shareType,
        comments: comments,
        usercomment: usercomment,
        nolocation: nolocation,
        map: map,
        isNear: isNear,
        prettyWhen: prettyWhen,
        setupComments: setupComments,
        finfo: finfo,
        faces: faces,
        setupFaces: setupFaces,
        playVid: playVid,
        getCountry: getCountry,
        isNullOrWhitespace: isNullOrWhitespace,
        near: near,

	showShareVidModal: function() {
            customDialogs.showShareVidModal( playing() );
        },
        
	activate: function( args ) {
	    this.mid = args.mid;
	    $(window).bind('resize', function() {
                resizePlayer();
            });
            
            return system.defer( function( dfd ) {
		viblio.api( '/services/mediafile/get', { mid: args.mid, include_contact_info: 1 } ).then( function( json ) {
		    var mf = json.media;
		    // Set now playing
                    //playingMid( json.media );
		    playing( new Mediafile( mf ) );
		    next_available_clip( 0 );

		    setupComments( mf );
		    setupFaces( mf );

		    // Get related vids
		    vstrip = new Strip( 'title', 'subtile' );

		    // This async routine is the long pole.  Let it do the promise() resolution to
		    // pause the system until we have all the data.
		    //
		    vstrip.search().then( function() {
			// Get all of the geo locations of the related media
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
	detached: function () {
            $(window).unbind( 'resizePlayer', resizePlayer );
            // Remove the player
            if(flowplayer()){
                flowplayer().unload();
            }
            if ( map ) map.destroy();
	},
	compositionComplete: function(view, parent) {
	    var self = this;
	    if ( ! this.mid ) {
		return;
	    }
		viblio.api( '/services/na/media_shared', { mid: self.mid }, errorHandler ).then( function(json) {
                    //shareType( json.share_type );
		    if ( json.auth_required ) {
			// This is a private share and you are not logged in.
			viblio.setLastAttempt( 'web_player?mid=' + self.mid );
			router.navigate( 'login?orsignup=true' );
		    }
		    else {
			var mf = json.media;
			playing( new Mediafile( mf ) );
                        playingMid( playing() );
			if ( playing() ) {
			    var mf = playing().media();
                            eyes( playing().media().eyes );
			    title( playing().media().title );
			    description( playing().media().description );
                            setupComments( mf );
                            setupFaces( mf );
			    self.showMessage( false );
			    $(".player").flowplayer( { src: "lib/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' }, {
				ratio: 9/16,
				clip: {
				    url: 'mp4:' + mf.views.main.cf_url,
				    ipadUrl: encodeURIComponent(mf.views.main.url),
				    // URL for sharing on FB, etc.
				    pageUrl: config.site_server + '/s/p/' + mf.views.main.uuid,
				    scaling: 'fit',
				    //ratio: 9/16,
				    //splash: true,
				    provider: 'rtmp',

				    // Google Analytics
				    onStart: function( clip ) {
					//console.log( 'Tracking start ...', clip.url );
					//viblio.gaEvent( 'WebPlay', 'Play', clip.url );
					viblio.mpEvent( 'web_play', { action: 'play' } );
                                        hidePlayerOverlay();
				    },
				    onPause: function( clip ) {
					//console.log( 'Tracking pause ...', clip.url, parseInt(this.getTime()) );
					//viblio.gaEvent( 'WebPlay', 'Pause', clip.url, parseInt(this.getTime()) );
					viblio.mpEvent( 'web_play', { action: 'pause' } );
                                        showPlayerOverlay(true);
				    },
				    onResume: function( clip ) {
					//console.log( 'Tracking resume ...', clip.url );
					//viblio.gaEvent( 'WebPlay', 'Resume', clip.url );
					viblio.mpEvent( 'web_play', { action: 'resume' } );
				    },
				    onStop: function( clip ) {		    
					//console.log( 'Tracking stop ...', clip.url, parseInt(this.getTime()) );
					//viblio.gaEvent( 'WebPlay', 'Stop', clip.url, parseInt(this.getTime()) );
					viblio.mpEvent( 'web_play', { action: 'stop' } );
				    },
				    onFinish: function( clip ) {
					//console.log( 'Tracking finish ...', clip.url );
					//viblio.gaEvent( 'WebPlay', 'Finish', clip.url );
					viblio.mpEvent( 'web_play', { action: 'finish' } );
                                        showPlayerOverlay(true);
				    }
				},
				plugins: {
				    // Wowza stuff
				    rtmp: {
					url: 'lib/flowplayer/flowplayer.rtmp-3.2.12.swf',
					netConnectionUrl: 'rtmp://' + config.cf_domain() + '/cfx/st'
				    },
				},
				canvas: {
				    backgroundColor:'#254558',
				    backgroundGradient: [0.1, 0]
				}
			    }).flowplayer().ipad({simulateiDevice: should_simulate()});
			    resizePlayer();
                            
                            // create the map
                            map = $("#geo-map").vibliomap({
                                disableZoomControl: true
                            });

                            // center/zoom to media file location
                            near( mf );
                            
                            // resize height of related video seciton based on page height
                            relatedVidHeight();
                            vstrip.updateScroller();
			}
		    }
		});
	}
    };
});
