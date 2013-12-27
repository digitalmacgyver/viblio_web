define( [ 'viewmodels/person', 'lib/related_video','viewmodels/footer' ], function( Face, Related, footer ) {
    var app = require( 'durandal/app' );
    var system = require( 'durandal/system' );
    var router = require( 'plugins/router' );
    var config = require( 'lib/config' );
    var viblio = require( 'lib/viblio' );
    var Mediafile = require( 'viewmodels/mediafile' );
    var customDialogs = require( 'lib/customDialogs' );

    var incoming_mid;
    var view;
    var route;

    var playing = ko.observable();
    var map;
    var isNear = ko.observable();
    var nolocation = ko.observable( true );

    var disable_prev = ko.observable( true );
    var disable_next = ko.observable( false );

    // These control what is visible and editable, depending on
    // if this is a user video, or a shared video (and how it
    // was shared, and if the sharee is logging in)
    //
    var title_editable = ko.observable( true );
    var recording_date_editable = ko.observable( true );
    var pp_related_column_visible = ko.observable( true );
    var can_leave_comments = ko.observable( true );
    var show_comments = ko.observable( true );
    var faces_taggable = ko.observable( true );
    var faces_identified_visible = ko.observable( true );
    var faces_unidentified_visible = ko.observable( true );
    var show_face_names = ko.observable( true );
    var share_button_visible = ko.observable( true );
    var get_the_app_button_visible = ko.observable( false );
    var get_the_app_overlay_logic = ko.observable( false );
    var map_location_editable = ko.observable( true );
    var new_face_addable = ko.observable( true );
    var user = viblio.user;
    var loggedIn = ko.computed(function(){
        if( user() && user().uuid != null ) {
            return true;
        } else {
            return false;
        }
    });
    var shareType = ko.observable();

    var title = ko.observable();
    var description = ko.observable();
    var formatted_date = ko.computed( function() {
        if ( playing() && playing().media() ) {
            var date = moment( playing().media().recording_date, 'YYYY-MM-DD HH:mm:ss' );
            if ( playing().media().recording_date == '1970-01-01 00:00:00' ) {
                return 'click to add recording date';
            }
            else {
                return date.format('MMM D, YYYY');
            }
        }
    });
    var usercomment = ko.observable('');

    var comments = ko.observableArray([]);

    // When title or description changes (due to inline edit),
    // change the playing video's observables, so the related vid on the
    // right gets updated.
    title.subscribe( function( v ) {
        playing().title( v );
    });
    description.subscribe( function( v ) {
        playing().description( v );
    });

    var faces = ko.observableArray([]);
    var unknown_faces = ko.observableArray([]);
    var known_faces = ko.observableArray([]);
    var faces_fetched = ko.observable( false );
    var add_face_to_video = ko.observable();

    var showPlayerOverlay = ko.observable(false);
    function hidePlayerOverlay() {
        showPlayerOverlay(false);
    }

    // default search criterion for related videos.
    var defaultCriterion = [ 'by_date',
			     'by_faces',
			     'by_geo' ];

    var mediafiles = ko.observableArray([]);
    var query_in_progress = ko.observable( false );
    var next_available_clip = ko.observable( 0 );

    // Play a new video.  Used after the main player is created in
    // attached.  This reuses the player to play a different clip.
    //
    function playVid( m ) {
        // Scroll to top of page
        $(document).scrollTop(0);

        if ( playing() )
            playing().unhighlight();

        playing( m );
        playing().highlight();

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

    // Play next related video
    function nextRelated() {
        // We need to ask the vstrip if the next available clip is 
        // actually available.  
        if ( Related.isClipAvailable( next_available_clip() ) ) {
            disable_prev( false );
            Related.scrollTo( mediafiles()[ next_available_clip() ] );
            playVid( mediafiles()[ next_available_clip() ] );
            next_available_clip( next_available_clip() + 1 );
            if ( ! Related.isClipAvailable( next_available_clip() ) )
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
            Related.scrollTo( mediafiles()[ next_available_clip() ] );
            playVid( mediafiles()[ next_available_clip() ] );
            next_available_clip( p + 1 );
            disable_next( false );
        }
    }

    // User can directly select a related video and
    // play it.
    function playRelated( m ) {
        var index = mediafiles.indexOf( m );
        next_available_clip( index + 1 );
        playVid( m );
    }

    function resizePlayer() {
	var player_height = ($(".pp-tv").width()*9) / 16;
	$(".pp-tv, .pp-tv video").height( player_height );
	resizeColumns();
    }

    function resizeColumns() {
	var player_height = $('.pp-tv').height();
	// The faces/map column dictates the height of the other columns
	var faces_map_height = $('.pp-info-faces-wrapper').height();
	var related_column_header = $('.pp-related-column-header').height() + $('.pp-related-column-share').height();
	var comment_header_height = $('.comment-header-wrap').height();
	var title_height = $('.pp-info-title').height();
	$('.all-comments').height( faces_map_height - title_height - (comment_header_height+24+10+21));
	$('.pp-related-column-related-videos').height( faces_map_height + (player_height + 50) - (related_column_header + 20) + 315 );
    }

    function should_simulate() {
	var videoel = document.createElement("video"),
	idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
	noflash = flashembed.getVersion()[0] === 0,
	simulate = !idevice && noflash &&
            !!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
	return simulate;
    }

    function setupFlowplayer( elem, mf ) {
	$(elem).flowplayer( { src: "lib/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' }, {
            ratio: 9/16,
            onMouseOver: function() {
                showPlayerOverlay(true);
            },
            onMouseOut: function() {
                // only hide the button if the mouse exits the player and is NOT hovereing over the shareButton
                if ( $('.shareButton:hover').length == 0 ) {
                    showPlayerOverlay(false);
                }
            },
            clip: {
                url: 'mp4:' + mf.views.main.cf_url,
                ipadUrl: encodeURIComponent(mf.views.main.url),
                scaling: 'fit',
                provider: 'rtmp',
                onStart: function( clip ) {
                    viblio.mpEvent( 'play', { action: 'play' } );
                    hidePlayerOverlay();
                },
                onPause: function( clip ) {
                    viblio.mpEvent( 'play', { action: 'pause' } );
                    showPlayerOverlay(true);
                },
                onResume: function( clip ) {
                    viblio.mpEvent( 'play', { action: 'resume' } );
                    hidePlayerOverlay();
                },
                onStop: function( clip ) {              
                    viblio.mpEvent( 'play', { action: 'stop' } );
                },
                onFinish: function( clip ) {
                    viblio.mpEvent( 'play', { action: 'finish' } );
                    showPlayerOverlay(true);
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
    }

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

    function addFace( face ) {
	var F = {
	    url: face.url,
	    uri: face.uri,
	    appears_in: 1,
	    contact_name: 'unknown',
	    contact_email: null
	};
	if ( face.contact ) {
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
	face.on( 'person:composed', function() {
	    resizeColumns();
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
		    
		    // If we are adding a contact to this media file that does
		    // not have a pitcure_uri, change the contact's picture_uri
		    // to this instance of the user's picture.
		    var tag_data = {
			uuid: f.data.uuid,
			cid:  data.contact.uuid };
		    if ( ! data.contact.picture_uri ) 
			tag_data.new_uri = f.data.uri

		    viblio.api( '/services/faces/tag', tag_data ).then( function() {
			if ( oldname == 'unknown' ) {
			    unknown_faces.remove( f );
			}
			// If this face is already displayed, remove it.
			var already_displayed = false;
			known_faces().forEach( function( ex ) {
			    if ( ex.name() == newname ) {
				already_displayed = true;
			    }
			});
			if ( ! already_displayed ) {
			    known_faces.push( f );
			}
		    });
		}
		else {
		    viblio.mpEvent( 'face_tag_to_identified' );
		    viblio.api( '/services/faces/tag', {
			uuid: f.data.uuid,
			new_uri: f.data.uri,
			contact_name: newname } ).then( function() {
			    unknown_faces.remove( f );
			    known_faces.push( f );
			});
		}
	    });
	});
	faces.push( face );
	if ( face.data.contact_name === null ) 
	    unknown_faces.push( face );
	else
	    known_faces.push( face );
    }

    function setupFaces( m ) {
	faces_fetched( false );
	faces.removeAll();
	unknown_faces.removeAll();
	known_faces.removeAll();
	viblio.api( '/services/faces/faces_in_mediafile', { mid: m.uuid } ).then( function( data ) {
	    if ( data.faces && data.faces.length ) {
		var count = data.faces.length;
		for( var i=0; i<count; i++ ) {
		    var face = data.faces[i];
		    addFace( face );
		}
	    }
	    faces_fetched( true );
	});
    }

    function removePerson( face ) {
	viblio.api( '/services/faces/remove_from_video', { 
	    cid: face.data.uuid, 
	    mid: playing().media().uuid } ).then( function( data ) {
		viblio.mpEvent( 'face_removed_from_video' );
		faces.remove( face );
		if ( face.data.contact_name === null )
		    unknown_faces.remove( face );
		else
		    known_faces.remove( face );
		//resizeColumns();
	    });
    }

    return {
	showShareVidModal: function() {
            customDialogs.showShareVidModal( playing() );
        },
        footer: footer,
	user: user,
	disable_next: disable_next,
	disable_prev: disable_prev,
	nextRelated: nextRelated,
	previousRelated: previousRelated,
	pp_related_column_visible: pp_related_column_visible,
	showPlayerOverlay: showPlayerOverlay,
	playing: playing,

	title: title,
	description: description,
	title_editable: title_editable,
	formatted_date: formatted_date,

	usercomment: usercomment,
	can_leave_comments: can_leave_comments,
	show_comments: show_comments,
	comments: comments,

	nolocation: nolocation,
	isNear: isNear,

	faces: faces,
	unknown_faces: unknown_faces,
	known_faces: known_faces,
	faces_fetched: faces_fetched,
	add_face_to_video: add_face_to_video,

	mediafiles: mediafiles,
	query_in_progress: query_in_progress,
	next_available_clip: next_available_clip,

	loggedIn: loggedIn,
	shareType: shareType,
	faces_taggable: faces_taggable,
	faces_identified_visible: faces_identified_visible,
	faces_unidentified_visible: faces_unidentified_visible,
	show_face_names: show_face_names,
	share_button_visible: share_button_visible,
	get_the_app_button_visible: get_the_app_button_visible,
	get_the_app_overlay_logic: get_the_app_overlay_logic,
	map_location_editable: map_location_editable,
	new_face_addable: new_face_addable,

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

	add_face: function( f ) {
	    viblio.api( '/services/faces/add_contact_to_mediafile', 
			{ contact_name: f, mid: playing().media().uuid } ).then( function( data ) {
			    var f = {
				url: data.contact.picture_url,
				uri: data.contact.picture_uri,
				contact: data.contact };
			    addFace( f );
			    add_face_to_video(); // reset the observable name
			});
	},

	attached: function( elem ) {
	    view = elem;
	},

	canActivate: function( args ) {
	    // How did we get here?  route will be one of new_player or web_player
	    route = router.activeInstruction().fragment;
	    viblio.log( 'route: ', route );

	    if ( args && args.mid ) {
		if ( route == 'web_player' ) {
		    return system.defer( function( dfd ) {
			viblio.setLastAttempt( 'web_player?mid=' + args.mid );
			viblio.api( '/services/na/media_shared', { mid: args.mid }, 
				    function( error ) {
					customDialogs.showWebPlayerError( "We're Sorry", error.message, error );
					dfd.resolve(false);
				    } ).then( function( data ) {
					if ( data.auth_required ) {
					    customDialogs.showWebPlayerError( 
						"We're Sorry", 
						'This is a privately shared video. You must be logged into your Viblio account to view it.  If you do not yet have an account, sign up today!', {} );
					    dfd.resolve(false);
					}
					else {
					    var mf = data.media;
					    // Set now playing
					    playing( new Mediafile( mf ) );
					    title( mf.title || 'Click to add a title' );
					    description( mf.description || 'Click to add a description' );

					    if ( mf.lat )
						nolocation( false );
					    else
						nolocation( true );

					    // THE SHARE MATRIX
					    
					    var share_type = data.share_type;
					    if ( share_type == 'owned_by_user' ) 
						share_type = 'private';
					    shareType( share_type );

					    // First of all, set all the things that are common on the
					    // web player page despite how the user came in.  This is
					    // essetially the public case.
					    //
					    title_editable( false );
					    recording_date_editable( false );
					    pp_related_column_visible( false );
					    can_leave_comments( false );
					    show_comments( true );
					    faces_taggable( false );
					    faces_identified_visible( true );
					    faces_unidentified_visible( false );
					    show_face_names( false );
					    share_button_visible( false );
					    get_the_app_button_visible( true );
					    get_the_app_overlay_logic( true );
					    map_location_editable( false );
					    new_face_addable( false );

					    if ( share_type == 'private' && loggedIn() ) {
						pp_related_column_visible( true );
						show_face_names( true );
						can_leave_comments( true );
					    }
					    else if ( share_type == 'hidden' && loggedIn() ) {
						pp_related_column_visible( true );
						show_face_names( true );
						can_leave_comments( true );
					    }
					    else if ( share_type == 'public' && loggedIn() ) {
						// This is the default
					    }
					    else if ( share_type == 'private' && ! loggedIn() ) {
						// This case is impossible, since user's are directed to the login or signup page,
						// but just in case ...
						customDialogs.showWebPlayerError( 
						    "We're Sorry", 
						    'This is a privately shared video. You must be logged into your Viblio account to view it.  If you do not yet have an account, sign up today!', {} );
					    }
					    else if ( share_type == 'hidden' && ! loggedIn() ) {
						show_face_names( true );
					    }
					    else if ( share_type == 'public' && ! loggedIn() ) {
						// This is the default
					    }

					    dfd.resolve( true );
					}
				    } );
		    }).promise();
		}
		else {
		    return true;
		}
	    }
	    else {
		customDialogs.showMessage( 'Navigating to this page requires an argument.', 'Navigation Error' );
		return false;
	    }
	},

	activate: function( args ) {
	    if ( args ) 
		incoming_mid = args.mid;

	    if ( route == 'new_player' ) {
		return viblio.api( '/services/mediafile/get', { mid: incoming_mid } ).then( function( json ) {
		    var mf = json.media;
		    // Set now playing
		    playing( new Mediafile( mf ) );
		    title( mf.title || 'Click to add a title' );
		    description( mf.description || 'Click to add a description' );
		});
	    }
	    else if ( route == 'web_player' ) {
	    }
	},

	detached: function () {
	    $(window).unbind( 'resize', resizePlayer );
	    if(flowplayer()){
                flowplayer().unload();
            }
	    if ( map ) map.destroy();
	},

	compositionComplete: function() {
	    setupFlowplayer( '.pp-tv', playing().media() );
	    setupFaces( playing().media() );
	    setupComments( playing().media() );
	    map = $("#geo-map").vibliomap({
                disableZoomControl: true
            });

	    // center/zoom to media file location
            near( playing().media() );

	    $(window).bind('resize', resizePlayer );

	    if ( pp_related_column_visible() ) {
		Related.init( '.pp-related-column-related-videos', mediafiles, query_in_progress, function( m ) {
		    playRelated( m );
		});
		Related.search( playing().media().uuid );
	    }

	    // related video search widget
	    $(view).find( '.related-by' ).editable({
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
                    Related.criterion.by_date  = false;
                    Related.criterion.by_faces = false;
                    Related.criterion.by_geo   = false;
                    v.forEach( function( key ) {
                        Related.criterion[key] = true;
                    });
                    Related.reset();
                    Related.search( incoming_mid );
                }
            });


	    // recording date editable
	    if ( recording_date_editable() ) {
		$(view).find(".recording-date").editable({
                    mode: 'popup',
                    type: 'date',
                    unsavedclass: null,
                    highlight: null,
                    savenochange: true,
                    format: 'yyyy-mm-dd',
                    viewformat: 'M d, yyyy',
                    showbuttons: 'bottom',
                    datepicker: {
			todayHighlight: true
                    },
                    success: function( res, v ) {
			var m = moment( v );
			var dstring = m.format( 'YYYY-MM-DD HH:mm:ss' );
			playing().media().recording_date = dstring;

			// The calander displays UTC. So read it as UTC and
			// convert it into local time.  Really just makes
			// the calander look as though it is displaying
			// local time, I think!
			var utc = moment.utc( v );
			dstring = utc.format( 'YYYY-MM-DD HH:mm:ss' );

			viblio.api( '/services/mediafile/change_recording_date', { mid: playing().media().uuid, date: dstring } ).then( function() {
			});
			return null;
                    }
		});
	    }

	    playing( playing() ); // tickles formatted_date
	}
    };
});
