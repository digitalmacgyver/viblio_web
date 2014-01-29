define([
    'durandal/system', 
    'plugins/router',
    'lib/viblio', 
    'lib/customDialogs',
    'viewmodels/album'], 
function( system, router, viblio, dialogs, Album ) {

    var pager = {};

    function resetPager() {
	pager = {
	    next_page: 1,
	    entries_per_page: 20,
	    total_entries: -1
	};
    }
    resetPager();

    var albums = ko.observableArray([]);
    var searching = ko.observable( true );
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
		    data.albums.forEach( function( album ) {
			var a = new Album( album, {  ro: false,
                                                     show_share_badge: true, 
						     show_preview: false,
						     share_action: 'trigger',
						     show_delete_mode: deleteModeOn() } );
                                        
			a.on( 'album:view', function( a ) {
			    router.navigate( 'viewAlbum?aid=' + a.media().uuid );
			});
			a.on( 'album:delete', function( a ) {
			    viblio.api( '/services/album/delete_album', { aid: a.media().uuid } ).then( function() {
				viblio.mpEvent( 'delete_album' );
				albums.remove( a );
			    });
			});         
			//
			// Share an album
			//
			a.on( 'album:share', function() {
			    dialogs.showMessage( 'This feature coming soon!', 'Share an Album' );
			});

			albums.push( a );
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
	albums: albums,
	searching: searching,
	editLabel: editLabel,

	toggleEditMode: function() {
	    var self = this;
            if ( editLabel() === 'Remove...' )
		editLabel( 'Done' );
            else
		editLabel( 'Remove...' );

	    albums().forEach( function( m ) {
		m.toggleEditMode();
	    });
	},

	compositionComplete: function( view ) {
	    var self = this;
	    resetPager();
	    albums.removeAll();
	    search();
            
            // Add click event to secondary buttons to toggle active class
            $('.yv-secondary-nav .btn').on('click', function(){
                $(this).toggleClass('active');
            });
	},

	add: function() {
	    router.navigate( 'albums' );
	},

	attached: function( view ) {
            searching(true);
	    $(window).scroll( this, scrollHandler );
	},

	detached: function( view ) {
	    $(window).off( 'scroll', scrollHandler );
	    albums.removeAll();
	}

    };

});
