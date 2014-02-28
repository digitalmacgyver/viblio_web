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
    var editLabel = ko.observable( 'Remove...' );
    
    // shared albums
    var sections = ko.observableArray([]);
    var sharedLabel = ko.observable( 'Shared with me' );
    var showShared = ko.observable( false );
    var sharedAlreadyFetched = false;
    var numShared = ko.observable();
    
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
    };

    function scrollHandler( event ) {
        var self = event.data;
	if( !searching() && !showShared() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
            search();
        }
    };
    
    function toggleShared() {
	if ( sharedLabel() === 'My Albums' ) {
	    sharedLabel( 'Shared with me' );
            showShared( false );
            // Make sure it relaods each time the button is pressed
            resetPager();
            albums.removeAll();
            search();
            editLabel( 'Remove...' );
        } else {
	    sharedLabel( 'My Albums' )
            showShared( true );
            //only fetch the shared videos once - commented out so it will refresh each time
            //if(sharedAlreadyFetched === false) {
                getNumShared();
                getShared();
            //}
            editLabel( 'Remove...' );
        }
    };
    
    function getShared() {
        searching( true );
        return viblio.api( '/services/album/list_shared_by_sharer' ).then( function( data ) {
            var shared = data.shared;
            
            sections.removeAll();
            shared.forEach( function( share ) {
                //self.numVids( self.numVids() + share.media.length );
                var albums = ko.observableArray([]);
                share.albums.forEach( function( album ) {
                    var a = new Album( album, {  ro: true,
                                                 show_share_badge: false, 
                                                 show_preview: true,
                                                 show_delete_mode: deleteModeOn() } );

                    a.on( 'album:view', function( a ) {
                        router.navigate( 'viewAlbum?aid=' + a.media().uuid );
                    });
                    a.on( 'album:delete', function( a ) {
                        viblio.api( '/services/album/remove_me_from_shared', { aid: a.media().uuid } ).then( function() {
                            viblio.mpEvent( 'delete_album' );
                            sections().forEach( function( section ) {
                                albums.remove( a );
                            });
			    numShared( numShared() - 1 );
                            sharedAlreadyFetched = false;
                        });
                    });
                    
                    albums.push( a );
                });
                share.owner.avatar = "/services/na/avatar?uid=" + share.owner.uuid + "&y=36";
                sections.push({ owner: share.owner, album: albums });
            });
            sharedAlreadyFetched = true;
            searching( false );
        });
    };
    
    function getNumShared() {
        viblio.api( '/services/album/list_shared').then( function( data ) {
            numShared( data.albums.length );
        });
    }

    // When a new album has been shared to me ... update the
    // screen in response to the async event
    app.on( 'album:new_shared_album', function( data ) {
	if ( ! showShared() ) return;
	viblio.api( '/services/album/get', { aid: data.aid } ).then( function( data ) {
	    var a = new Album( data.album, { ro: true,
                                             show_share_badge: false, 
                                             show_preview: true,
                                             show_delete_mode: deleteModeOn() } );
	    
            a.on( 'album:view', function( a ) {
                router.navigate( 'viewAlbum?aid=' + a.media().uuid );
            });
            a.on( 'album:delete', function( a ) {
                viblio.api( '/services/album/remove_me_from_shared', { aid: a.media().uuid } ).then( function() {
                    viblio.mpEvent( 'delete_album' );
                    sections().forEach( function( section ) {
                        section.album.remove( a );
                    });
		    numShared( numShared() - 1 );
                    sharedAlreadyFetched = false;
                });
            });
	    var owner = data.album.owner;
            owner.avatar = "/services/na/avatar?uid=" + owner.uuid + "&y=36";
	    var found = false;
	    sections().forEach( function( section ) {
		if ( section.owner.uuid == owner.uuid ) {
		    found = true;
		    section.album.push( a );
		}
	    });
	    if ( ! found ) 
		sections.push({ owner: owner, album: ko.observableArray([ a ]) });
	    numShared( numShared() + 1 );
	});
    });

    // When I've been removed from a shared album ... update the
    // screen in response to the async event
    app.on( 'album:delete_shared_album', function( data ) {
	if ( ! showShared() ) return;
	sections().forEach( function( section ) {
	    section.album().forEach( function( album ) {
		if ( album.media().uuid == data.aid ) {
		    section.album.remove( album );
		    numShared( numShared() - 1 );
		}
	    });
	});
    });

    return {
	albums: albums,
	searching: searching,
	editLabel: editLabel,
        sections: sections,
        sharedLabel: sharedLabel, 
        showShared: showShared,
        toggleShared: toggleShared,
        deleteModeOn: deleteModeOn,
        numShared: numShared,

	toggleEditMode: function() {
            if ( editLabel() === 'Remove...' )
                editLabel( 'Done' );
            else
                editLabel( 'Remove...' );

            if( sharedLabel() === 'My Albums' ) {
                sections().forEach( function( section ) {
                    section.album().forEach( function( mf ) {
                        mf.toggleEditMode();
                    });
                });
            } else {
                albums().forEach( function( mf ) {
                    mf.toggleEditMode();
                });
            }
	},

	compositionComplete: function( view ) {
	    var self = this;
	    resetPager();
	    albums.removeAll();
            if( !showShared() ) {
                search();
            }
            
            // Add click event to secondary buttons to toggle active class
            /*$('.yv-secondary-nav .btn').on('click', function(){
                $(this).toggleClass('active');
            });*/
	},

	add: function() {
	    router.navigate( 'albums' );
	},

	attached: function( view ) {
            if( !showShared() ) {
                searching(true);
            }
	    $(window).scroll( this, scrollHandler );
	},

	detached: function( view ) {
	    $(window).off( 'scroll', scrollHandler );
	    albums.removeAll();
	}

    };

});
