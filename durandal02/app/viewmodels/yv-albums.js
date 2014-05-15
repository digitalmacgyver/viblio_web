define([
    'durandal/system', 
    'durandal/app', 
    'plugins/router',
    'lib/viblio', 
    'lib/customDialogs',
    'viewmodels/album'], 
function( system, app, router, viblio, dialogs, Album ) {

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
    var editLabel = ko.observable( '<i class="icon-minus"></i> Remove...' );   
    
    var deleteModeOn = ko.computed( function() {
        if( editLabel() === 'Done' ) {
            return true;
        } else {
            return false;
        }
    });
    
    // Add a new album to our managed list of albums
    addAlbum = function( album ) {
        
        var a;
        
        if( album.shared_to_me == 1 ) {
            // Shared with user
            a = new Album( album, {  ro: true,
                                         shared_style: true,
                                         show_shared_badge: false,
                                         show_share_badge: false, 
                                         show_preview: true,
                                         show_delete_mode: deleteModeOn() } );

            a.on( 'album:view', function( a ) {
                router.navigate( 'viewAlbum?aid=' + a.media().uuid );
            });
            a.on( 'album:delete', function( a ) {
                viblio.api( '/services/album/remove_me_from_shared', { aid: a.media().uuid } ).then( function() {
                    viblio.mpEvent( 'delete_album' );
                    albums.remove( a );
                });
            });    
        } else {
            // Owned by user
            a = new Album( album, {  ro: false,
                                         show_shared_badge: album.is_shared ? true : false,
                                         show_share_badge: true, 
                                         show_preview: false,
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
        }
        	         
	// Add it to the list
	albums.push( a );
    };

    function search() {
	searching( true );
	return system.defer( function( dfd ) {
	    if ( pager.next_page ) {
		viblio.api( '/services/album/list_all', { views: ['poster'], page: pager.next_page, rows: pager.entries_per_page } ).then( function( data ) {
		    pager = data.pager;
		    data.albums.forEach( function( album ) {
			addAlbum( album );
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
    };

    function scrollHandler( event ) {
        var self = event.data;
	if( !searching() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
            search();
        }
    };
    
    // When a new album has been shared to me ... update the
    // screen in response to the async event
    app.on( 'album:new_shared_album', function( data ) {
	viblio.api( '/services/album/get', { aid: data.aid } ).then( function( data ) {
            addAlbum( data.album );
	});
    });

    // When I've been removed from a shared album ... update the
    // screen in response to the async event
    app.on( 'album:delete_shared_album', function( data ) {
        albums().forEach( function( album ) {
            if ( album.media().uuid == data.aid ) {
                albums.remove( album );
            }
        });
    });

    return {
	albums: albums,
	searching: searching,
	editLabel: editLabel,
        deleteModeOn: deleteModeOn,

	toggleEditMode: function() {
            if ( editLabel() === '<i class="icon-minus"></i> Remove...' )
                editLabel( 'Done' );
            else
                editLabel( '<i class="icon-minus"></i> Remove...' );
            
            albums().forEach( function( mf ) {
                mf.toggleEditMode();
            });
            
	},
        
	compositionComplete: function( view ) {
	    var self = this;
	    resetPager();
	    albums.removeAll();
            search();
            
            // Add click event to secondary buttons to toggle active class
            /*$('.yv-secondary-nav .btn').on('click', function(){
                $(this).toggleClass('active');
            });*/
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
