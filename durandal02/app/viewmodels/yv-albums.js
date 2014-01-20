define([
    'durandal/system', 
    'plugins/router',
    'lib/viblio', 
    'lib/customDialogs',
    'viewmodels/mediafile'], 
function( system, router, viblio, dialogs, Mediafile ) {

    var pager = {};

    function resetPager() {
	pager = {
	    next_page: 1,
	    entries_per_page: 20,
	    total_entries: -1
	};
    }
    resetPager();

    var media = ko.observableArray([]);
    var searching = ko.observable( false );
    var editLabel = ko.observable( 'Remove...' );

    var deleteModeOn = ko.computed( function() {
        if( editLabel() === 'Done' ) {
            return true;
        } else {
            return false;
        }
    });

    function search() {
	searching( true );
	return system.defer( function( dfd ) {
	    if ( pager.next_page ) {
		viblio.api( '/services/album/list', { views: ['poster'], page: pager.next_page, rows: pager.entries_per_page } ).then( function( data ) {
		    pager = data.pager;
		    data.albums.forEach( function( mf ) {
			var m = new Mediafile( mf, { show_share_badge: true, 
						     show_preview: false,
						     share_action: 'trigger',
						     show_delete_mode: deleteModeOn() } );
			m.on( 'mediafile:play', function( m ) {
			    router.navigate( 'viewAlbum?aid=' + m.media().uuid );
			});
			m.on( 'mediafile:delete', function( m ) {
			    viblio.api( '/services/album/delete_album', { aid: m.media().uuid } ).then( function() {
				viblio.mpEvent( 'delete_album' );
				media.remove( m );
			    });
			});         
			//
			// Share an album
			//
			m.on( 'mediafile:share', function() {
			    dialogs.showMessage( 'This feature coming soon!', 'Share an Album' );
			});
			//
			// Once the album is composed and has a view, add mouse-over
			// callbacks that cycle through the media posters that belong to
			// this album.
			//
			m.on( 'mediafile:composed', function() {
			    $(m.view).on( 'mouseover', function() {
				if ( ! m.i_timer ) {
				    var count = 0;
				    m.change_poster( m.media().media[count].views.poster.url );
				    count += 1;
				    if ( count >= m.media().media.length )
					count = 0;
				    m.i_timer = setInterval( function() {
					m.change_poster( m.media().media[count].views.poster.url );
					count += 1;
					if ( count >= m.media().media.length )
					    count = 0;
				    }, 1000 );
				}
			    });
			    $(m.view).on( 'mouseleave', function() {
				clearInterval( m.i_timer ); m.i_timer = 0;
				m.reset_poster();
			    });
			});

			media.push( m );
		    });
		    dfd.resolve();
		});
	    }
	    else {
		dfd.resolve();
	    }
	}).promise().then( function() {
	    searching( false );
	});
    }

    function scrollHandler( event ) {
        var self = event.data;
	if( !searching() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
            search();
        }
    }

    return {
	media: media,
	searching: searching,
	editLabel: editLabel,

	toggleEditMode: function() {
	    var self = this;
            if ( editLabel() === 'Remove...' )
		editLabel( 'Done' );
            else
		editLabel( 'Remove...' );

	    media().forEach( function( m ) {
		m.toggleEditMode();
	    });
	},

	compositionComplete: function( view ) {
	    var self = this;
	    resetPager();
	    media.removeAll();
	    search();
	},

	add: function() {
	    router.navigate( 'albums' );
	},

	attached: function( view ) {
	    $(window).scroll( this, scrollHandler );
	},

	detached: function( view ) {
	    $(window).off( 'scroll', scrollHandler );
	    media.removeAll();
	}

    };

});
