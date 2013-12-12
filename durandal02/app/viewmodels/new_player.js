/*
  The player page.  Where we play user videos and show
  actors, related videos and other interesting metadata

  The way to play a video is to

  router.navigate( 'player?mid=uuid' );

  Where uuid is a mediafile uuid.  The mediafile is
  actually fetched from the server to play.  We do it
  this way in case we use this page as a link to shared
  videos.
*/
define( ['durandal/app','durandal/system','plugins/router','plugins/dialog','lib/config','lib/viblio','viewmodels/mediavstrip','viewmodels/person','viewmodels/mediafile','lib/customDialogs'], function(app,system,router,dialog,config,viblio,Strip,Face,Mediafile,customDialogs) {
    function resizePlayer() {
	$("#tv, #tv video").height( ($("#tv").width()*9) / 16 );
    }

    function relatedVidHeight() {
        var newHeight = $('#playerCommentsNavTable').height() + 18;
        
	$('#related-videos-block').find('.vstrip .media-container').css( 'height', newHeight );
        vstrip.updateScroller();
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
    var playing = ko.observable();
    
    var vstrip;
    
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

    // This observable will contain the vstrip when it is
    // created in attached.  Its a view model and is
    // composed into the main view.
    //
    var related = ko.observable();

    // Title and description - code to update/change is located in custom_bindings.js
    var title = ko.observable();
    var description = ko.observable();
    
    // The user comment
    var usercomment = ko.observable('');

    // Currently playing video location status
    var nolocation = ko.observable( true );

    // When title or description changes (due to inline edit),
    // change the playing video's observables, so the related vid on the
    // right gets updated.

    title.subscribe( function( v ) {
	playing().title( v );
    });
    
    description.subscribe( function( v ) {
	playing().description( v );
    });
    
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
                // returns now in UTC time
		var now = new Date().getTime();
		data.comments.forEach( function( c ) {
		    var hash = { comment: c.comment };
		    hash['who'] = c.who || 'anonymous';
                    // create a date format that is usable
                    var temp = c.created_date.replace(/-/g,',').replace(/ /g, ",").replace(/:/g, ",");
                    var array = temp.split(',');
                    for (a in array ) {
                        array[a] = parseInt(array[a], 10);
                    }
                    // take one from the month to get correct month based on 0 index
                    array[1] = array[1] - 1;
                    // get difference between now and when comment was created both in UTC time
                    hash['when'] = prettyWhen( now, new Date(Date.UTC(array[0], array[1], array[2], array[3], array[4], array[5])) );
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
			contact_name: 'unknown',
			contact_email: null
		    };
		    if ( face.contact ) {
			ident += 1;
			F.contact_name = face.contact.contact_name;
			F.contact_email = face.contact.contact_email;
			F.id = face.contact.contact_id;
			F.uuid = face.contact.uuid;
		    }
		    var face = new Face( F, { 
			clickable: false, 
			leftBadgeIcon: 'icon-remove-circle',
			leftBadgeClick: removePerson,
			leftBadgeMode: 'hover',
			show_name: false, 
			show_tag3: true,
		    });
		    face.on( 'person:tag3_changed', function( f, newname, oldname ) {
			// Have to see if newname is an existing contact...
			viblio.api( '/services/faces/contact_for_name', { contact_name: newname } ).then( function( data ) {
			    if ( data.contact ) {
				if ( oldname == 'unknown' ) {
				    // Unidentifed to identified
				    viblio.mpEvent( 'face_tag_to_new' );
				}
				else {
				    // Merge identified
				    viblio.mpEvent( 'face_merge' );
				}
				viblio.api( '/services/faces/tag', {
				    uuid: f.data.uuid,
				    cid:  data.contact.uuid } ).then( function() {
					// If this face is already displayed, remove it.
					faces().forEach( function( ex ) {
					    if ( ex.name() == newname && ex != f ) {
						faces.remove( ex );
					    }
					});
				    });
			    }
			    else {
				viblio.mpEvent( 'face_tag_to_identified' );
				viblio.api( '/services/faces/tag', {
				    uuid: f.data.uuid,
				    contact_name: newname } );
			    }
			});
		    });
		    faces.push( face );
		}
		finfo( 'Starring' );
	    }
	    else {
		finfo( '' );
	    }
	});
    }

    function removePerson( face ) {
	viblio.api( '/services/faces/remove_from_video', { 
	    cid: face.data.uuid, 
	    mid: playing().media().uuid } ).then( function( data ) {
		viblio.mpEvent( 'face_removed_from_video' );
		faces.remove( face );
	    });
    }

    // Play a new video.  Used after the main player is created in
    // attached.  This reuses the player to play a different clip.
    //
    function playVid( m ) {
        // Scroll to top of page
        $(document).scrollTop(0);
        playing( m );
	title( playing().title() || 'Click to add a title.' );
	description( playing().description() || 'Click to add a description.' );
        setupComments( m.media() );
	setupFaces( m.media() );
	near( m.media() );

	// We don't nessesarily have the main urls needed to stream
	// the video.  If we don't, go get them and save them in the
	// related video structure.
	if ( ! m.media().views.main ) {
	    viblio.api( '/services/mediafile/cf', { mid: m.media().uuid } ).then( function( data ) {
		if ( data && data.url && data.cf_url ) {
		    m.media().views.main = { url: data.url, cf_url: data.cf_url };
		    flowplayer().play({
			url: 'mp4:' + m.media().views.main.cf_url,
			ipadUrl: encodeURIComponent(m.media().views.main.url)
		    });
		}
	    });
	}
	else {
	    flowplayer().play({
		url: 'mp4:' + m.media().views.main.cf_url,
		ipadUrl: encodeURIComponent(m.media().views.main.url)
            });
	}
	viblio.mpEvent( 'related_video' );
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
	// map.disableSetLocation();
	if ( m.lat ) {
	    viblio.api( '/services/geo/location', { lat: m.lat, lng: m.lng } ).then( function( res ) {
		if ( res && res.length ) {
		    nolocation( false );
		    isNear( getCountry( res ) );
		    map.addMarker( m.lat, m.lng, m, true );
		}
		else {
		    isNear( 'Find in map' );
		    // comingSoon(m);
		    nolocation( true );
		}
	    });
	}
	else {
	    isNear( 'Find in map' );
	    // comingSoon(m);
	    nolocation( true );
	}
    }

    function comingSoon( m ) {
	map.centerDefault();
	map.enableSetLocation( function( latlng ) {
	    viblio.api( '/services/geo/change_latlng', 
			{ mid: playing().media().uuid,
			  lat: latlng.lat,
			  lng: latlng.lng } ).then( function() {
			      playing().media().lat = latlng.lat;
			      playing().media().lng = latlng.lng;
			      near( playing().media() );
			  });
	});
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
        showShareVidModal: function() {
            customDialogs.showShareVidModal( playing() );
        },
	user: viblio.user,
	query: query,
	playing: playing,
	title: title,
	nolocation: nolocation,
	description: description,
        vstrip: vstrip,
	comments: comments,
	usercomment: usercomment,
	finfo: finfo,
	isNear: isNear,
	faces: faces,
	related: related,
	previousRelated: previousRelated,
	nextRelated: nextRelated,
	disable_prev: disable_prev,
	disable_next: disable_next,
	showInteractiveMap: function() {
	    customDialogs.showInteractiveMap( playing().media, {
		disableMapDrag: false,
		disableMapMouseZoom: false,
		disableMapTouchZoom: false,
		disableMapClickZoom: true,
		doneCallback: function( m ) {
		    near( m );
		}
	    });
	},
	relocate: function() {
	    viblio.mpEvent( 'change_location' );
	    customDialogs.showInteractiveMap( playing().media, {
		relocate: true,
		disableMapDrag: false,
		disableMapMouseZoom: false,
		disableMapTouchZoom: false,
		disableMapClickZoom: true,
		doneCallback: function( m ) {
		    near( m );
		}
	    });
	},
	activate: function( args ) {
	    // capture the query arguments
	    query(args);

	    if ( ! query() ) {
		router.navigate( 'home' );
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
		    router.navigate( 'home' );
		});
	    }

	    return system.defer( function( dfd ) {
		viblio.api( '/services/mediafile/get', { mid: mid } ).then( function( json ) {
		    var mf = json.media;
		    // Set now playing
		    playing( new Mediafile( mf ) );
		    next_available_clip( 0 );

		    setupComments( mf );
		    setupFaces( mf );

		    // Get related vids
		    vstrip = new Strip( 'title', 'subtile' );

		    // This async routine is the long pole.  Let it do the promise() resolution to
		    // pause the system until we have all the data.
		    //
		    console.log( 'VSTRIP SEARCH due to new_player activate' );
		    vstrip.search(mid).then( function() {
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
	    self.view = view;

	    var mid = query().mid;
	    var mf = playing().media();
            title( playing().media().title || 'Click to add a title.' );
            description( playing().media().description || 'Click to add a description.' );
	    // Instanciate the main flowplayer

	    $("#tv").flowplayer( { src: "lib/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' }, {
		ratio: 9/16,
                clip: {
                    url: 'mp4:' + mf.views.main.cf_url,
                    ipadUrl: encodeURIComponent(mf.views.main.url),
                    scaling: 'fit',
                    provider: 'rtmp',
		    // Google Analytics
		    onStart: function( clip ) {
			//console.log( 'Tracking start ...', clip.url );
			//viblio.gaEvent( 'PrivatePlay', 'Play', clip.url );
			viblio.mpEvent( 'play', { action: 'play' } );
		    },
		    onPause: function( clip ) {
			//console.log( 'Tracking pause ...', clip.url, parseInt(this.getTime()) );
			//viblio.gaEvent( 'PrivatePlay', 'Pause', clip.url, parseInt(this.getTime()) );
			viblio.mpEvent( 'play', { action: 'pause' } );
		    },
		    onResume: function( clip ) {
			//console.log( 'Tracking resume ...', clip.url );
			//viblio.gaEvent( 'PrivatePlay', 'Resume', clip.url );
			viblio.mpEvent( 'play', { action: 'resume' } );
		    },
		    onStop: function( clip ) {		    
			//console.log( 'Tracking stop ...', clip.url, parseInt(this.getTime()) );
			//viblio.gaEvent( 'PrivatePlay', 'Stop', clip.url, parseInt(this.getTime()) );
			viblio.mpEvent( 'play', { action: 'stop' } );
		    },
		    onFinish: function( clip ) {
			//console.log( 'Tracking finish ...', clip.url );
			//viblio.gaEvent( 'PrivatePlay', 'Finish', clip.url );
			viblio.mpEvent( 'play', { action: 'finish' } );
		    }
                },
                plugins: {
		    // Cloudfront
                    rtmp: {
                        url: 'lib/flowplayer/flowplayer.rtmp-3.2.12.swf',
                        netConnectionUrl: 'rtmp://' + config.cf_domain() + '/cfx/st'
                    }
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

	    // Set up the inline editable for related by
	    var defaultCriterion = [];
	    if ( vstrip.criterion.by_date )  defaultCriterion.push( 'by_date' );
	    if ( vstrip.criterion.by_faces ) defaultCriterion.push( 'by_faces' );
	    if ( vstrip.criterion.by_geo )   defaultCriterion.push( 'by_geo' );
	    $(self.view).find( '.related-by' ).editable({
		mode: 'popup',
		type: 'checklist',
		placement: 'left',
		emptytext: 'by...',
		emptyclass: '',
		source: [{value:'by_date',  text: 'by date'},
			 {value:'by_faces', text: 'by people'},
			 {value:'by_geo',   text: 'by location'}],
		value: defaultCriterion,
		validate: function( v ) {
		    if ( v.length == 0 ) {
			return({ newValue:defaultCriterion,
				 msg: 'Select at least one criterion' });
		    }
		},
		success: function( res, v) {
		    vstrip.criterion.by_date  = false;
		    vstrip.criterion.by_faces = false;
		    vstrip.criterion.by_geo   = false;
		    v.forEach( function( key ) {
			vstrip.criterion[key] = true;
		    });
		    vstrip.reset();
		    vstrip.search( query().mid );
		}
	    });
        }
    };
});

