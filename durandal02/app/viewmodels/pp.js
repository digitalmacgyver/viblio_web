define( [ 'viewmodels/person' ], function( Face ) {
    var app = require( 'durandal/app' );
    var system = require( 'durandal/system' );
    var router = require( 'plugins/router' );
    var config = require( 'lib/config' );
    var viblio = require( 'lib/viblio' );
    var Mediafile = require( 'viewmodels/mediafile' );
    var Strip = require( 'viewmodels/mediavstrip' );
    var customDialogs = require( 'lib/customDialogs' );

    var incoming_mid;
    var view;

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
    var pp_related_column_visible = ko.observable( true );
    var can_leave_comments = ko.observable( true );
    var show_comments = ko.observable( true );

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

    var showPlayerOverlay = ko.observable(false);
    function hidePlayerOverlay() {
        showPlayerOverlay(false);
    }

    // Play next related video
    function nextRelated() {
    }

    // Play previous related video
    function previousRelated() {
    }

    function resizePlayer() {
	$(".pp-tv, .pp-tv video").height( ($(".pp-tv").width()*9) / 16 );
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

    return {
	showShareVidModal: function() {
            customDialogs.showShareVidModal( playing() );
        },
	user: viblio.user,
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

	attached: function( elem ) {
	    view = elem;
	},

	activate: function( args ) {
	    if ( args ) 
		incoming_mid = args.mid;
	    if ( incoming_mid ) {
		return viblio.api( '/services/mediafile/get', { mid: incoming_mid } ).then( function( json ) {
		    var mf = json.media;
		    // Set now playing
		    playing( new Mediafile( mf ) );
		    title( mf.title || 'Click to add a title' );
		    description( mf.description || 'Click to add a description' );
		});
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
	    setupComments( playing().media() );
	    map = $("#geo-map").vibliomap({
                disableZoomControl: true
            });
	    // center/zoom to media file location
            near( playing().media() );

	    $(window).bind('resize', resizePlayer );

	    playing( playing() ); // tickles formatted_date
	}
    };
});
