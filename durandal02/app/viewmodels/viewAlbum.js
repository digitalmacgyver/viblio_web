define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/mediafile', 'viewmodels/hscroll', 'viewmodels/yir', 'lib/customDialogs', 'viewmodels/allVideos', ], function (router, app, system, viblio, Mediafile, HScroll, YIR, customDialogs, allVideos) {

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
    var allVideos = ko.observableArray();
    var filterLabels = ko.observableArray();
    var selectedYear = ko.observable( null );
    var showAllVids = ko.observable( true );
    var refresh = ko.observable( false );
    
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
        
        self.months().forEach( function( month ) {
	    month.media().forEach( function( mf ) {
		mf.toggleEditMode();
	    });
	});
    };
    
    // Right before the user navigates away from the page set the prevAid to the 
    // currAid so we know when to reload the AID section or not. Also set prevAlbum
    // to currAlbum so we know when to refresh the whole page (used to test updated titles)
    router.on( 'router:route:activating', function() {
	prevAid( currAid() );
        prevAlbum( currAlbum() );
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
    
    app.on( 'album:name_changed', function( album ) {
        var changedAid = album.uuid;
        if( changedAid == album_id ) {
            showBOH( false );
            refresh( true );
        }
    });
    
    function checkOwner() {
        if( ownerUUID() == viblio.user().uuid ){
            ownedByViewer( true );
        } else {
            ownedByViewer( false );
        }
    };
    
    // fetch videos for given year
    function fetch( year ) {
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
            if ( data.years.length >= 1 ) {
                years()[0].selected( true );
                fetch( years()[0].label );
            }
            loadingYears( false );
        });
    }
    
    function getFilterLabels() {
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
    }
    
    function addMediaFile( mf ) {
	var self = this;

	// Create a new Mediafile with the data from the server
	var m = new Mediafile( mf, ownedByViewer ? { show_share_badge: true } : {} );

	// Register a callback for when a Mediafile is selected.
	// This is so we can deselect the previous one to create
	// a radio behavior.
	m.on( 'mediafile:selected',  function( sel ) {
	    self.mediaSelected( sel );
	});

	// Play a mediafile clip.  This uses the query parameter
	// passing technique to pass in the mediafile to play.
	m.on( 'mediafile:play', function( m ) {
	    router.navigate( 'new_player?mid=' + m.media().uuid );
	});

	m.on( 'mediafile:composed', function() {
	    $( ".horizontal-scroller").trigger( 'children-changed', { enable: true } );
	});
        
        m.on( 'mediafile:delete', function( m ) {
            viblio.api( '/services/album/remove_media?', { aid: album_id, mid: m.media().uuid } ).then( function() {
                viblio.mpEvent( 'remove_video_from_album' );
                months().forEach( function( month ) {
                    month.media.remove( m );
                });
                boxOfficeHits.remove( function(video) { return video.view.id == m.media().uuid } );
                $( ".horizontal-scroller").trigger( 'children-changed', { enable: true } );
                refresh( true );
            });
        });
        
        m.on( "mediaFile:TitleDescChanged", function() {
            var uuid = this.view.id;
            var title = this.title();
            if( boxOfficeHits().length > 0 ) {
                // If title is changed in Box Office Hits section update title in AIR
                if( this.view.parentElement.className == 'scrollableArea' ) {
                    months().forEach( function( month ) {
                        month.media().forEach( function( mf ) {
                            if( mf.view.id == uuid ) {
                                mf.title( title );
                            }
                        });
                    });
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
    
    return {
        showShareAlbumModal: function() {
	    customDialogs.showMessage( 'This feature coming soon!', 'Share an Album' );
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
        allVideos: allVideos,
        filterLabels: filterLabels,
        selectedYear: selectedYear,
        showAllVids: showAllVids,
        mediaHasViews: mediaHasViews,
        editLabel: editLabel,
        toggleEditMode: toggleEditMode,
        showBOH: showBOH,
        
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
	},
        
        getAllVids: function() {
            showAllVids(true);
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
                allVideos.removeAll();
                years.removeAll();
                months.removeAll();
                boxOfficeHits.removeAll();
                albumTitle('');
            }
            getFilterLabels();
        },
	/*attached: function() {
	    return system.defer( function( dfd ) {
		customDialogs.showLoading();
		dfd.resolve();
	    }).promise();
	},*/
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
                    viblio.api( 'services/album/get?aid=' + album_id ).then( function( data ) {
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
                            allVideos.push( addMediaFile( mf ) );
                        });

                        //reverse the order of the sorted array
                        boxOfficeHits.reverse(boxOfficeHits.sort( function(l, r) {
                            return Number(l.media().view_count) < Number(r.media().view_count) ? -1 : 1;
                        }));

                        albumTitle( currAlbum().title );
                        ownerPhoto( "/services/na/avatar?uid=" + ownerUUID() + "&y=66" );

                        checkOwner();

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
            
            refresh( false );
	}
    };
});
