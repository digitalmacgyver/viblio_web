define( ['plugins/router', 
	 'durandal/app', 
	 'durandal/system', 
	 'lib/viblio', 
	 'viewmodels/mediafile', 
	 'viewmodels/album', 
	 'viewmodels/hscroll', 
	 'viewmodels/yir', 
	 'lib/customDialogs', 
	 'viewmodels/allVideos', ], 
function (router, app, system, viblio, Mediafile, Album, HScroll, YIR, customDialogs, allVideos) {

    var years  = ko.observableArray();
    var loadingYears = ko.observable( true );
    var yearIsSelected = null;
    var months = ko.observableArray();
    var albumTitle = ko.observable();
    var album_id;
    var prevAid = ko.observable( null );
    var currAid = ko.observable();
    var ownerPhoto = ko.observable();
    var ownerName  = ko.observable();
    var ownerUUID = ko.observable();
    var ownedByViewer = ko.observable();
    var boxOfficeHits = ko.observableArray();
    var allVids = ko.observableArray();
    var filterLabels = ko.observableArray();
    var selectedYear = ko.observable( null );
    var showAllVids = ko.observable( true );
    var refresh = ko.observable( false );
    var viewerOwnsAVideo = ko.observable( false );
    var vidsOwnedByViewerNum = ko.observable( 0 );
    
    var albumLabels = ko.observableArray();
    var selectedAlbum = ko.observable(); 
    
    var albumIsShared = ko.observable();
    var sharedWithDisplayname = ko.observable();
    var sharedWithMembers = ko.observableArray();
    
    var noVids = ko.computed(function() {
        if ( allVids().length === 0 ) {
            return true;
        } else {
            return false;
        }
    });
    
    var showBOH = ko.observable();
    
    var updatedTitle = ko.observable( null );
    var prevAlbum = ko.observable( null );
    var currAlbum = ko.observable();
    
    var mediaHasViews = ko.observable( false );
    
    // An edit/done label to use on the GUI
    var editLabel = ko.observable( 'Edit' );
    
    // Toggle edit mode.  This will put all of media
    // files in the strip into/out of edit mode.  I'm thinking
    // this will be the way user's can delete their media files
    function toggleEditMode() {
	var self = this;
	if ( self.editLabel() === 'Edit' )
	    self.editLabel( 'Done' );
	else
	    self.editLabel( 'Edit' );
        
        if( showAllVids() ) {
            self.allVids().forEach( function( mf ) {
                if ( ownedByViewer() ) {
                    mf.toggleEditMode();
                } else if ( mf.show_share_badge() ) {
                    mf.toggleEditMode();                    
                }
            });
        } else {
            self.months().forEach( function( month ) {
                month.media().forEach( function( mf ) {
                    if ( ownedByViewer() ) {
                        mf.toggleEditMode();
                    } else if ( mf.show_share_badge() ) {
                        mf.toggleEditMode();                    
                    }
                });
            });
        }
    };
    
    // Right before the user navigates away from the page set the prevAid to the 
    // currAid so we know when to reload the AID section or not. Also set prevAlbum
    // to currAlbum so we know when to refresh the whole page (used to test updated titles)
    router.on( 'router:route:activating', function() {
	prevAid( currAid() );
        prevAlbum( currAlbum() );
    });
    
    // If album is shared by user, show the members as they are added - triggered in shareAlbumModal
    app.on('album:album_shared', function( aid ) {
        var sharedAID = aid;
        if ( sharedAID == album_id ) {
            getSharedMembers();
        }
    });
    
    app.on( 'album:newMediaAdded', function( album ) {
        var changedAid = album.uuid;
        if( changedAid == album_id ) {
            showBOH( false );
            refresh( true );
        }
    });
    
    app.on( "mediaFile:TitleDescChanged", function( mf ) {
        updatedTitle( mf.uuid );
    });
    
    /*app.on( 'album:name_changed', function( album ) {
        var changedAid = album.uuid;
        if( changedAid == album_id ) {
            showBOH( false );
            refresh( true );
        }
    });*/
    
    function checkOwner() {
        if( ownerUUID() == viblio.user().uuid ){
            ownedByViewer( true );
        } else {
            ownedByViewer( false );
        }
    };
    
    app.on( 'album:name_changed', function( album ) {
        viblio.api( '/services/album/change_title', { aid: album_id, title: albumTitle() } ).then(function() {
            albumLabels().forEach( function( a ){
                if( a.uuid == album_id ) {
                    a.title = albumTitle();
                    a.label( albumTitle() );
                }
            });
            // resort the labels
            albumLabels( albumLabels().sort(function(left, right) { return left.label().toLowerCase() == right.label().toLowerCase() ? 0 : (left.label().toLowerCase() < right.label().toLowerCase() ? -1 : 1) }) );
        });
    });
    
    function mfOwnedByViewer( mf ) {
        if( mf.owner_uuid == viblio.user().uuid ){
            return true;
        } else {
            return false;
        }
    };
    
    // fetch videos for given year
    function fetch( year ) {
        loadingYears( true );
        var args = { year: year,
                     aid: album_id };
        viblio.api( '/services/air/videos_for_year', args ).then( function( data ) {
            months.removeAll();
            data.media.forEach( function( month ) {
                var mediafiles = ko.observableArray([]);
                month.data.forEach( function( mf ) {
                    mediafiles.push( addMediaFile( mf ) );
                });
                months.push({month: month.month, media: mediafiles});
            });
            loadingYears( false );
        });
        yearIsSelected = true;
    }

    // get the years to display in the year navigator
    function getYears() {
        loadingYears( true );
        var args = { aid: album_id };
	viblio.api( '/services/air/years', args ).then( function( data ) {
            var arr = [];
            data.years.forEach( function( year ) {
                arr.push({ label: year, selected: ko.observable(false) });
            });
            years( arr );
            loadingYears( false );
        });
    }
    
    function getAllAlbumsLabels() {
        albumLabels.removeAll();
        viblio.api( '/services/album/album_names').then( function(data) {
            var arr = [];
            data.albums.forEach( function( album ) {
                var _album = album;
                _album.label = ko.observable( album.title );
                _album.selected = ko.observable( false );
                
                arr.push( _album );
            });
            //alphabetically sort the list - toLowerCase() makes sure this works as expected
            arr.sort(function(left, right) { return left.label().toLowerCase() == right.label().toLowerCase() ? 0 : (left.label().toLowerCase() < right.label().toLowerCase() ? -1 : 1) });
            albumLabels( arr );
            
            albumLabels().forEach(function(album) {
                if( album.uuid == album_id ){
                    album.selected(true);
                }
            });
        });
    };
    
   function albumSelected( album, self ) {
        albumLabels().forEach( function( a ) {
            a.selected( false );
        });
        album.selected( true );
        selectedAlbum( album );
        
        router.navigate( 'viewAlbum?aid=' + album.uuid );
    };
    
    // Makes the albumsList 'sometimes sticky'
    function stickyAlbumsList() {       
        var maxPos = 105; //height of header (65) + 40 (top offset of albums list)
        
        var scrollTop = $(window).scrollTop(),
        elementOffset = $('.albumsList').offset().top,
        distance      = (elementOffset - scrollTop),
        footerHeight  = ( $('#footer').offset().top ) - scrollTop;

        if( distance <= maxPos ){
            $('.albumsList').addClass('stuck');
            // keep the albumsList section above the footer
            if ( $(window).width() >= 900 ) {
                $('.albumsList').css( { 'height': footerHeight - 65, 'max-height': $(window).height() - 65 } );
            } else {
                $('.albumsList').css( { 'height': footerHeight, 'max-height': $(window).height() } );
            }            
        }
        
        if ( $(window).width() >= 900 ) {
            if ( ( $('.viewAlbumInner').offset().top ) - scrollTop >= 105 ){
                $('.albumsList').removeClass('stuck');
                $('.albumsList').css( { 'height': '100%' } );
            }    
        } else {
            if ( ( $('.viewAlbumInner').offset().top ) - scrollTop >= 40 ){
                $('.albumsList').removeClass('stuck');
                $('.albumsList').css( { 'height': '100%' } );
            }
        }
        
    };
    
    /*function getFilterLabels() {
        var args = { aid: album_id };
	viblio.api( '/services/air/years', args ).then( function( data ) {
            data.years.forEach( function( year ) {
                var args = { year: year,
                             aid: album_id };
                viblio.api( '/services/air/videos_for_year', args ).then( function( data ) {
                    data.media.forEach( function( month ) {
                        filterLabels.push( { label: month.month + ' ' + year, selected: ko.observable(false) } );
                    });
                });
            });
        });
    }*/
    
    function getSharedMembers() {
        viblio.api('/services/album/shared_with', {aid: album_id}).then( function( data ) {
            sharedWithDisplayname( data.displayname );
            sharedWithMembers( data.members );
        });
    }
    
    function addMediaFile( mf ) {
	var self = this;
        
	// Create a new Mediafile with the data from the server - Only albums owned by the viewer will be given the share badge
	var m = new Mediafile( mf, mfOwnedByViewer(mf) ? { show_share_badge: true, show_preview: true, delete_title: albumIsShared() ? 'unshare' : 'remove', show_faces_tags: true, ownedByViewer: true } : { show_preview: true, delete_title: 'remove', ro: true, show_faces_tags: true, ownedByViewer: false } );

	// Register a callback for when a Mediafile is selected.
	// This is so we can deselect the previous one to create
	// a radio behavior.
	m.on( 'mediafile:selected',  function( sel ) {
	    self.mediaSelected( sel );
	});

	// Play a mediafile clip.  This uses the query parameter
	// passing technique to pass in the mediafile to play.
	m.on( 'mediafile:play', function( m ) {
	    if ( m.media().owner_uuid == viblio.user().uuid )
		router.navigate( 'new_player?mid=' + m.media().uuid );
	    else
		router.navigate( 'web_player?mid=' + m.media().uuid );
	});

	m.on( 'mediafile:composed', function() {
	    $( ".horizontal-scroller").trigger( 'children-changed', { enable: true } );
	});
        
        m.on( 'mediafile:delete', function( m ) {
            viblio.api( '/services/album/remove_media?', { aid: album_id, mid: m.media().uuid } ).then( function() {
                viblio.mpEvent( 'remove_video_from_album' );
                // Remove from allVids
                allVids.remove( function(video) { return video.view.id == m.media().uuid; } );
                // Remove from months
                months().forEach( function( month ) {
                    month.media.remove( m );
                });
                // Remove from boxOfficeHits
                boxOfficeHits.remove( function(video) { return video.view.id == m.media().uuid; } );
                $( ".horizontal-scroller").trigger( 'children-changed', { enable: true } );
                refresh( true );
                if ( m.show_share_badge() ) {
                    vidsOwnedByViewerNum( vidsOwnedByViewerNum()-1 );
                }
            });
        });
        
        m.on( "mediaFile:TitleDescChanged", function() {
            var uuid = this.view.id;
            var title = this.title();
            // Update name in allVids no matter what
            allVids().forEach(function( mf ) {
                if( mf.view.id == uuid ) {
                    mf.title( title );
                }
            });
            if( boxOfficeHits().length > 0 ) {
                // If title is changed in Box Office Hits section update title in AIR
                if( this.view.parentElement.className == 'scrollableArea' ) {
                    if( !showAllVids() ) {
                        months().forEach( function( month ) {
                            month.media().forEach( function( mf ) {
                                if( mf.view.id == uuid ) {
                                    mf.title( title );
                                }
                            });
                        });    
                    }
                } else {
                    // Otherwise title was updated in AIR, so update title in Box Office Hits
                    boxOfficeHits().forEach( function( mf ) {
                        if( mf.view.id == uuid ) {
                            mf.title( title );
                        }
                    });
                }    
            }
        });

	return m;
    };

    // Trigger on sync events from the server, when new videos are added or
    // removed from the shared album being viewed.
    app.on( 'album:new_shared_album_video', function( data ) {
	if ( data.aid != currAlbum().uuid ) return;
	viblio.api( '/services/album/get_shared_video', { mid: data.mid } ).then( function( data ) {
	    allVids.push( addMediaFile( data.media ) );	    
	});
    });

    app.on( 'album:delete_shared_album_video', function( data ) {
	if ( data.aid != currAlbum().uuid ) return;
        allVids.remove( function(video) { return video.view.id == data.mid; } );
        // Remove from months
        months().forEach( function( month ) {
            month.media.remove( function(media) { return media.media().uuid == data.mid; } );
        });
        // Remove from boxOfficeHits
        boxOfficeHits.remove( function(video) { return video.view.id == data.mid; } );
        $( ".horizontal-scroller").trigger( 'children-changed', { enable: true } );
        refresh( true );
    });
    
    return {
        showShareAlbumModal: function() {
	    customDialogs.showShareAlbumModal( new Album( currAlbum() ) );
        },
        years: years,
        loadingYears: loadingYears,
        yearIsSelected: yearIsSelected,
        months: months,
        albumTitle: albumTitle,
        displayName: 'Album',        
	ownerPhoto: ownerPhoto,
	ownerName: ownerName,
        ownedByViewer: ownedByViewer,
        boxOfficeHits: boxOfficeHits,
        allVids: allVids,
        filterLabels: filterLabels,
        selectedYear: selectedYear,
        showAllVids: showAllVids,
        mediaHasViews: mediaHasViews,
        editLabel: editLabel,
        toggleEditMode: toggleEditMode,
        noVids: noVids,
        showBOH: showBOH,
        viewerOwnsAVideo: viewerOwnsAVideo,
        vidsOwnedByViewerNum: vidsOwnedByViewerNum,
        
        albumLabels: albumLabels,
        albumSelected: albumSelected,
        
        albumIsShared: albumIsShared,
        sharedWithDisplayname: sharedWithDisplayname,
        sharedWithMembers: sharedWithMembers,
        getSharedMembers: getSharedMembers,
        
        title: 'Box Office Hits',
        subtitle: 'The most popular videos in this album',
        
        yearSelected: function( year, self ) {
            months.removeAll();
            selectedYear( year.label );
	    years().forEach( function( y ) {
		y.selected( false );
            });
            year.selected( true );
            //viblio.mpEvent( 'yir' );
            fetch( year.label );
            editLabel('Edit');
	},
        
        getAllVids: function() {
            showAllVids(true);
            years().forEach( function( y ) {
		y.selected( false );
            });
            editLabel('Edit');
        },
        
        activate: function (args) {
	    album_id = args.aid;
            currAid( album_id );
            if( currAid() != prevAid() ) {
                showBOH( false );
                refresh( true );
            }
            // Check to see if the recently updated mediafile is in the album, if so refresh( true )
            if( updatedTitle() != null ) {
                if( currAid() == prevAid() ) {
                    currAlbum().media.forEach( function( mf ) {
                        if( mf.uuid == updatedTitle() ) {
                            showBOH( false );
                            refresh( true );
                            updatedTitle( null );
                            return;
                        }
                    });
                }    
            }
            if( refresh() ){
                showAllVids( true );
                allVids.removeAll();
                years.removeAll();
                months.removeAll();
                boxOfficeHits.removeAll();
                albumTitle('');
            }
            //getFilterLabels();
            
            getAllAlbumsLabels();
        },
	
        attached: function() {
            $(window).scroll( this, stickyAlbumsList );
        },

        detached: function() {
            $(window).off( "scroll", stickyAlbumsList );
        },
        
	compositionComplete: function( view, parent ) {
	    var self = this;
	    system.wait(1).then( function() {
		customDialogs.hideLoading();
	    });
            // only refresh the AIR section if the user is viewing a different album than before
            
            if( refresh() ) {
                getYears();
            }
            
            // get the years labels for the videos in the album, select most recent year, and get months for that year
            //getYears();
            
            self.editLabel( 'Edit' );
            // only refresh page if the user is viewing a different album than before or if new media has been added to an album
            if( refresh() ){
                /*years.removeAll();
                months.removeAll();
                boxOfficeHits.removeAll();*/
                //return system.defer( function( dfd ) {
                sharedWithDisplayname('');
                vidsOwnedByViewerNum( 0 );
                    viblio.api( 'services/album/get?aid=' + album_id + '&include_contact_info=1&include_tags=1' ).then( function( data ) {
                        system.log(data);
                        albumIsShared( data.album.is_shared ? true : false );
                        currAlbum( data.album );
                        ownerName( currAlbum().owner.displayname );
                        ownerUUID( currAlbum().owner.uuid );
                        mediaHasViews( false );
                        currAlbum().media.forEach( function( mf ) {
                            if( mf.view_count > 0 ) {
                                mediaHasViews( true );
                                showBOH( true );
                                boxOfficeHits.push( addMediaFile( mf ) );
                            }
                            allVids.push( addMediaFile( mf ) );
                            // If one of the mf's is owned by the viewer then set viewerOwnsAVideo to true, increment vidsOwnedByViewerNum by one
                            if ( mfOwnedByViewer( mf ) ) {
                                viewerOwnsAVideo(true );
                                vidsOwnedByViewerNum( vidsOwnedByViewerNum()+1 );
                            }
                        });

                        //reverse the order of the sorted array
                        boxOfficeHits.reverse(boxOfficeHits.sort( function(l, r) {
                            return Number(l.media().view_count) < Number(r.media().view_count) ? -1 : 1;
                        }));

                        albumTitle( currAlbum().title );
                        ownerPhoto( "/services/na/avatar?uid=" + ownerUUID() + "&y=66" );

                        checkOwner();
                        
                        if( albumIsShared() ) {
                            getSharedMembers();
                        }

                        //dfd.resolve();
                    });
                //}).promise();
            }
            //years.removeAll();
            //months.removeAll();
            viblio.mpEvent( 'album viewed' );
            
            // Set the prevAid and currAid to equal the first time the user navigates to the page (or it's refreshed).
            if( prevAid() == null ){
                prevAid( currAid() );
            }
            // Set prevAlbum and currAlbum to equal when user first navigates to an album
            if( prevAlbum() == null ) {
                prevAlbum( currAlbum() );
            }
            
            stickyAlbumsList();
            
            refresh( true );
	}
    };
});
