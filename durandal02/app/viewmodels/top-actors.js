/*
  Like the old pscroll, but a component that can be composed onto a multi-area
  screen.  Manages its own fscroll as a "popover".
*/
define([
    'durandal/events',
    'plugins/router', 
    'durandal/app', 
    'durandal/system', 
    'lib/viblio', 
    'viewmodels/person', 
    'viewmodels/fscroll',
    'lib/customDialogs'], 
function (Events, router, app, system, viblio, Face, VideosFor, dialogs) {
    var view;
    var title = ko.observable('People in your Videos');
    var subtitle = ko.observable('');

    var faces = ko.observableArray([]);
    var currentSelection = null;
    var pager = {};
    function reset_pager() {
	pager = {
            next_page: 1,
            entries_per_page: 50,
            total_entries: -1 /* currently unknown */
        };
    }
    reset_pager();

    var fetched = ko.observable( false );

    // When new faces arrive in the system async, add them
    // to the start of the list.
    app.on( 'face:ready', function( mf ) {
        var m = addFace( mf );
        faces.unshift( m );
        $(view).find( ".sd-pscroll").trigger( 'children-changed' );
    });

    var videosFor = ko.observable( new VideosFor( 'n Videos with Anonymous', '', '' ) );

    function face_selected( face, pos ) {
	var videoOrVideos = null;
        if(face.data.appears_in == 1) {
            videoOrVideos = "Video";
        } else {
            videoOrVideos = "Videos";
        }
        if ( videosFor().isvisible() && showing_videos_for == face.data.uuid ) {
            videosFor().hide();
	    currentSelection = null;
        }
        else {
            showing_videos_for = face.data.uuid; 
            videosFor().clear();
            videosFor().search( face.data.uuid );
            videosFor().setTitle( face.data.appears_in + ' ' + 
				  videoOrVideos +' with ' + 
				  face.data.contact_name );
            videosFor().setName( face.data.contact_name );     
            videosFor().show( pos );
            viblio.mpEvent( 'videos_for_actor' );
        }
    }

    function addFace( mf ) {
        // Create a new Face with the data from the server
        var m = new Face( mf, {
            show_name: true,
            clickable: true,
            click: function( person ) {
                var pos = $(person.view).offset().left + Math.round( $(person.view).width() / 2 );
                if ( currentSelection && currentSelection != person )
                    $(currentSelection.view).removeClass( 'selected' );
		currentSelection = person;
                face_selected( person, pos );
            }
        });

        m.on( 'person:mouseover', function() {
            $(m.view).addClass( 'selected' );
        });

        m.on( 'person:mouseleave', function() {
            if ( m != currentSelection )
                $(m.view).removeClass( 'selected' );
        });

        m.on( 'person:composed', function() {
            $(view).find( ".sd-pscroll").trigger( 'children-changed', { enable: true } );
        });

        return m;
    };

    function search() {
	if ( pager.next_page ) {
            // pause is needed to temporarily turn off the timers that control
            // hover and mousedown scrolling, while we go off and fetch data
            // it will be re-enabled in mediafile:composed at the proper time
            $(view).find( ".sd-pscroll").smoothDivScroll("pause");
	    fetched( false );
            viblio.api( '/services/faces/contacts',
                        { page: pager.next_page, 
			  rows: pager.entries_per_page } )
		.then( function( json ) {
                    pager = json.pager;
		    fetched( true );
                    json.faces.forEach( function( mf ) {
			faces.push( addFace( mf ) );
                    });
		});
	}
    };

    function resize_fstrip() {
	$(view).find( '.fstrip').width(
	    $(window).width() );
    };

    app.on( 'unnamed:tagged', function( face ) {
	faces.removeAll();
	reset_pager();
	search();
    });

    app.on( 'top-actor:remove', function( uuid ) {
	faces.remove( function(f) {
	    return( f.data.uuid == uuid );
	});
    });

    return {
	title: title,
	subtitle: subtitle,
	faces: faces,
	fetched: fetched,
	videosFor: videosFor,

	faceSelected: function( face, pos ) {
            face_selected( face, pos );
            if ( currentSelection ) {
		if ( currentSelection != face ) {
                    currentSelection.selected( false );
		}
            }
            currentSelection = face;
	},

	no_select: function() {
	    if ( currentSelection )
		$(currentSelection.view).removeClass( 'selected' );
	},
        
        activate: function() {
            fetched( false );
            faces.removeAll();
        },

	compositionComplete: function( _view ) {
	    view = _view;
	    reset_pager();
	    search();
	    resize_fstrip();
	    app.trigger( 'top-actors:composed', this );
	},

	hLimitReached: function() {
            if ( pager.next_page ) {
		search();
            }
            else {
		// Since we hacked the widget to remove flicker,
		// we need to manually hide the right most arrow when
		// we hit the end.
		$(view).find( ".sd-pscroll").smoothDivScroll("nomoredata");
            }
	},

	attached: function( _view ) {
	    view = _view;
	    resize_fstrip();
	    $(window).bind( 'resize', resize_fstrip );
	},

	detached: function() {
	    $(window).unbind( 'resize', resize_fstrip );
            videosFor().hide();
            videosFor().clear();
	    if ( currentSelection ) {
		$(currentSelection.view).removeClass( 'selected' );
		currentSelection = null;
	    }
	}
    };
	
});

