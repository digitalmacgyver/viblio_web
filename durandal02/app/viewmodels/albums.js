define(['durandal/app','plugins/router','lib/viblio','lib/customDialogs','viewmodels/mediafile'], function( app, router, viblio, dialogs, Mediafile ) {

    var years  = ko.observableArray([]);
    var months = ko.observableArray([]);
    var albums = ko.observableArray([]);
    var drop_box_width = ko.observable('99%');
    var no_albums = ko.observable(false);
    var searching = ko.observable( false );
    var loadingYears = ko.observable( true );
    var yearIsSelected = null;
    
    var pager = {
        next_page: 1,
        entries_per_page: 25,
        total_entries: -1 /* currently unknown */
    };
    
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
	if ( album.uuid )
	    viblio.api( '/services/album/change_title', { aid: album.uuid, title: album.name() } );
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
        yearIsSelected = true;
    }

    // get the years to display in the year navigator
    function getYears() {
        loadingYears( true );
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
            loadingYears( false );
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

    function search() {
	if ( pager.next_page ) {
	    searching( true );
	    viblio.api( '/services/album/list', { page: pager.next_page, rows: pager.entries_per_page } ).then( function( data ) {
		pager = data.pager;
		if ( data.albums.length >= 1 ) {
		    no_albums( false );
		    data.albums.forEach( function( album ) {
			var media = ko.observableArray([]);
			album.media.forEach( function( mf ) {
			    media.push( new Mediafile( mf ) );
			});
			albums.unshift({ name: ko.observable( album.title ),
					 uuid: album.uuid,
					 media: media });
		    });
		}
		else {
		    no_albums( true );
		    albums.unshift({ name: ko.observable('Your First Album'), uuid: null, media: ko.observableArray([]) });
		}
		searching( false );
	    });
	}
    }

    return {
	drop_box_width: drop_box_width,
	years: years,
	months: months,
	albums: albums,
	no_albums: no_albums,
	searching: searching,
        loadingYears: loadingYears,
        yearIsSelected: yearIsSelected,
        
        viewAlbum: function($data) {
            router.navigate('viewAlbum?aid=' + $data.uuid);
        },

	yearSelected: function( self, year ) {
	    years().forEach( function( y ) {
		y.selected( false );
            });
            year.selected( true );
            //viblio.mpEvent( 'yir' );
            fetch( year.label );
	},
        
	// A new album is not committed to the database until the first
	// mediafile is added to it.
	//
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
		if ( album.uuid ) { 
		    // add media to an exiting album
		    viblio.api( '/services/album/add_media', { aid: album.uuid, mid: mf.media().uuid } ).then( function() {
			album.media.unshift( mf );
		    });
		}
		else {
		    // create a new album with this media file as initial media
		    viblio.api( '/services/album/create', { name: album.name(), initial_mid: mf.media().uuid } ).then( function( data ) {
			no_albums( false );
			album.uuid = data.album.uuid;
			album.media.unshift( mf );
		    })
		}
	    }
	},

	goToUpload: function() {
            router.navigate( 'getApp?from=albums' );
	},

	attached: function( elem ) {
	    view = elem;
	},

	activate: function() {
	    pager.next_page = 1;
            pager.total_entries = -1;
	    albums.removeAll();
            //prevents videos from reloading everytime a user navigates to the albums page - keeps the selected year
            if( !yearIsSelected ) {
                years.removeAll();
                getYears();
                months.removeAll();
            }
	},

	compositionComplete: function() {
	    resizeColumns();

	    // Fetch albums.  If none, create an initial fake album
            search();

	    // Infinite scroll support
	    $(view).find('.a-right-content').scroll( $.throttle( 250, function() {
		var $this = $(this);
		var height = this.scrollHeight - $this.height(); // Get the height of the div
		var scroll = $this.scrollTop(); // Get the vertical scroll position

		if ( searching() ) return;
		if ( height == 0 && scroll == 0 ) return;

		var isScrolledToEnd = (scroll >= height);

		if (isScrolledToEnd) {
                    search();
		}
            }));

	    if ( head.mobile ) {
		$(view).find( '.a-content' ).kinetic();
	    } 
            
	    $(window).on( 'resize', resizeColumns );
	    resizeColumns();
	}
    };
});
