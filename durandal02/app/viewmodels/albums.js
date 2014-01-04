define(['durandal/app','lib/viblio','lib/customDialogs','viewmodels/mediafile'], function( app, viblio, dialogs, Mediafile ) {

    var years  = ko.observableArray([]);
    var months = ko.observableArray([]);
    var albums = ko.observableArray([]);
    var drop_box_width = ko.observable('99%');
    var no_albums = ko.observable(false);

    function resizeColumns() {
	// The column heights fit the screen and are scrollable
	var h = $(window).height() - $(view).offset().top - $('#footer').height();
	$(view).find( '.a-wrapper' ).height( h );
	$(view).find( '.a-left-content' ).height( h - $(view).find( '.a-left-wrapper' ).offset().top );
	$(view).find( '.a-right-content' ).height( h - $(view).find( '.a-right-wrapper' ).offset().top );

	// The dropbox widths need adjustment to follow resizes
	var columnw = ($(window).width() / 2 )- 80 - 3;
	drop_box_width( columnw + 'px' );
    }

    // User changed an album title
    app.on( 'album:name_changed', function( album ) {
	//viblio.log( 'new name', album.name() );
    });

    // fetch videos for given year
    function fetch( year ) {
        var args = { year: year };
        viblio.api( '/services/yir/videos_for_year', args ).then( function( data ) {
            months.removeAll();
            data.media.forEach( function( month ) {
                var mediafiles = ko.observableArray([]);
                month.data.forEach( function( mf ) {
                    var m = new Mediafile( mf );
		    m.on( 'mediafile:composed', function( e ) {
			$(e.view).draggable({
			    appendTo: '.albums',
			    scope: 'mediafile',
			    helper: 'clone',
			    scroll: true,
			    opacity: 0.75
			});
		    });
                    mediafiles.push( m );
                });
                months.push({month: month.month, media: mediafiles});
            });   
        });
    }

    // get the years to display in the year navigator
    function getYears() {
	viblio.api( '/services/yir/years' ).then( function( data ) {
            var arr = [];
            data.years.forEach( function( year ) {
                arr.push({ label: year, selected: ko.observable(false) });
            });
            years( arr );
            if ( data.years.length >= 1 ) {
                years()[0].selected( true );
                fetch( years()[0].label );
            }
        });
    }

    // For the album name prompt.  Verify that the user input is OK.
    function naVerify( response, prompt ) {
	if ( response == 'OK' ) {
	    if ( $.trim( prompt ) == '' ) {
		return 'Please input a valid album name';
	    }
	    else {
		var inuse = false;
		albums().forEach( function( a ) {
		    if ( a.name == $.trim( prompt ) ) {
			inuse = true;
		    }
		});
		if ( inuse )
		    return 'This name is already in use';
		else
		    return null;
	    }
	}
	else {
	    return null;
	}
    }

    return {
	drop_box_width: drop_box_width,
	years: years,
	months: months,
	albums: albums,
	no_albums: no_albums,

	yearSelected: function( self, year ) {
	    years().forEach( function( y ) {
		y.selected( false );
            });
            year.selected( true );
            //viblio.mpEvent( 'yir' );
            fetch( year.label );
	},
        
	newAlbum: function() {
	    dialogs.showTextPrompt( 'Give this album a name.', 'New Album', { verify: naVerify, placeholder: 'Album Name', buttons: [ 'OK', 'Cancel' ] } ).then( function( r, p ) {
		if ( r == 'OK' ) {
		    var name = $.trim( p );
		    albums.unshift({ name: ko.observable(name), uuid: null, media: ko.observableArray([]) });
		}
	    });
	},

	albumDrop: function( mf ) {
	    var album = this;
	    //viblio.log( 'Dropped mediafile', mf.media().uuid, 'on album', album.name );
	    if ( album.media.indexOf( mf ) != -1 ) {
		// No dups!
		return dialogs.showError( 'This video is already present in this album!', 'Album' );
	    }
	    else {
		// IF no_albums() == true, then we need to create a new album first, then add this
		// video to it.  Otherwise its an exiting album. *** OR *** we can always do this, and
		// NOT add a new album to the database in newAlbum().
		album.media.unshift( mf );
	    }
	},

	attached: function( elem ) {
	    view = elem;
	},

	compositionComplete: function() {
	    resizeColumns();
	    getYears();

	    // Fetch albums.  If none, create an initial fake album
	    no_albums( true );
	    albums.unshift({ name: ko.observable('Your First Album'), uuid: null, media: ko.observableArray([]) });

	    if ( head.mobile ) {
		$(view).find( '.a-content' ).kinetic();
	    } 
            
	    $(window).on( 'resize', resizeColumns );
	    resizeColumns();
	}
    };
});
