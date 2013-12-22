define( function() {
    var app = require( 'durandal/app' );
    var system = require( 'durandal/system' );
    var router = require( 'plugins/router' );
    var config = require( 'lib/config' );
    var viblio = require( 'lib/viblio' );
    var Face   = require( 'viewmodels/person' );
    var Mediafile = require( 'viewmodels/mediafile' );
    var Strip = require( 'viewmodels/mediavstrip' );
    var customDialogs = require( 'lib/customDialogs' );

    var query = {};
    var next_available_clip = ko.observable( 0 );
    var playing = ko.observable();
    var comments = ko.observableArray([]);
    var related = ko.observable([]);
    var showPlayerOverlay = ko.observable(false);
    function hidePlayerOverlay() {
        showPlayerOverlay(false);
    }
    var title = ko.observable();
    var description = ko.observable();
    title.subscribe( function( v ) {
        playing().title( v );
    });
    description.subscribe( function( v ) {
        playing().description( v );
    });
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
    var nolocation = ko.observable( true );
    var map = null;
    var isNear = ko.observable();
    var disable_prev = ko.observable( true );
    var disable_next = ko.observable( false );

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

    function setupFlowplayer( elem ) {
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
    }

    function setupRelatedEditable( elem ) {
	$(elem).find( '.related-by' ).editable({
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

    function setupRecordingDateEditable( elem ) {
	$(elem).find(".recording-date").editable({
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
        if ( playing().media().recording_date == '1970-01-01 00:00:00' ) {
            $(elem).find(".recording-date").editable('setValue', new Date(), false);
        }
        else {
            $(elem).find(".recording-date").editable('setValue', rd_to_Date( playing().media().recording_date ), false);
        }
        playing( playing() );
    }

    