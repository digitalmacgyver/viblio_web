define( ['durandal/app','durandal/system','plugins/router','lib/config','lib/viblio','lib/customDialogs','viewmodels/mediafile', 'viewmodels/face',], function( app,system,router,config,viblio,customDialogs,Mediafile,Face) {

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
    
    var eyes = ko.observable();
    var title = ko.observable();
    var description = ko.observable();
    var showMessage = ko.observable( true );

    var showError = ko.observable( false );
    var errorMessage = ko.observable();
    var errorDetail = ko.observable();
    
    var shareType = ko.observable('hidden');
    
    // Comments associated with currently playing video
    var comments = ko.observableArray([]);
    
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
		    faces.push( new Face( F, { allow_changes: false, show_name: false, selectable: false } ) );
		}
		finfo( 'Starring' );
	    }
	    else {
		finfo( 'No faces detected' );
	    }
	});
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
		    });
    });
    
    return {
	user: viblio.user,
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
        getCountry: getCountry,
        isNullOrWhitespace: isNullOrWhitespace,
        near: near,
        
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
                    //shareType( json.share_type );
		    if ( json.auth_required ) {
			// This is a private share and you are not logged in.
			viblio.setLastAttempt( 'web_player?mid=' + self.mid );
			router.navigate( 'login?orsignup=true' );
		    }
		    else {
			var mf = json.media;
			playing( new Mediafile( mf ) );
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
					viblio.gaEvent( 'WebPlay', 'Play', clip.url );
				    },
				    onPause: function( clip ) {
					//console.log( 'Tracking pause ...', clip.url, parseInt(this.getTime()) );
					viblio.gaEvent( 'WebPlay', 'Pause', clip.url, parseInt(this.getTime()) );
				    },
				    onResume: function( clip ) {
					//console.log( 'Tracking resume ...', clip.url );
					viblio.gaEvent( 'WebPlay', 'Resume', clip.url );
				    },
				    onStop: function( clip ) {		    
					//console.log( 'Tracking stop ...', clip.url, parseInt(this.getTime()) );
					viblio.gaEvent( 'WebPlay', 'Stop', clip.url, parseInt(this.getTime()) );
				    },
				    onFinish: function( clip ) {
					//console.log( 'Tracking finish ...', clip.url );
					viblio.gaEvent( 'WebPlay', 'Finish', clip.url );
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
			}
		    }
		});
	}
    };
});
