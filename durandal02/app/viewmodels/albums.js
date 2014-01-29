define(['durandal/app','plugins/router','lib/viblio','lib/customDialogs','viewmodels/mediafile','durandal/system'], function( app, router, viblio, dialogs, Mediafile,system ) {

    var albums = ko.observableArray([]);
    var monthsLabels = ko.observableArray([]);
    var videos = ko.observableArray([]);
    var drop_box_width = ko.observable('99%');
    var no_albums = ko.observable(false);
    var searching = ko.observable( false );
    var hits = ko.observable();
    
    var allVidsIsSelected = ko.observable( true );
    var aMonthIsSelected = ko.observable(false);
    var selectedMonth = ko.observable();
    var vidsInSelectedMonth = ko.observable();
    var isActiveFlag = ko.observable(false);

    // Hold the pager data back from server
    // media queries.  Initialize it here so
    // the first fetch works.
    var allVidsPager = {
        next_page: 1,
        entries_per_page: 20,
        total_entries: -1 /* currently unknown */
    };

    var monthPager = {
        next_page: 1,
        entries_per_page: 20,
        total_entries: -1 /* currently unknown */
    };
    
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
	if ( album.uuid && album.name )
	    viblio.api( '/services/album/change_title', { aid: album.uuid, title: album.name() } );
    });

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

    function albumSearch() {
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
	albums: albums,
        monthsLabels: monthsLabels,
        videos: videos,
        allVidsIsSelected: allVidsIsSelected,
        aMonthIsSelected: aMonthIsSelected,
        selectedMonth: selectedMonth,
        vidsInSelectedMonth: vidsInSelectedMonth,
        isActiveFlag: isActiveFlag,
        hits: hits,
        allVidsPager: allVidsPager,
        monthPager: monthPager,
        
	no_albums: no_albums,
	searching: searching,
        
        viewAlbum: function($data) {
            router.navigate('viewAlbum?aid=' + $data.uuid);
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
                        app.trigger('album:newMediaAdded', album)
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
        
        // Get the number of mediafiles so the allVids style can be decided on.
        // 3 or more mediafiles gets the normal view, while less than 3 gets 
        // the "Got more videos?" view.
        getHits: function() {
            var self = this;
            var args = {};
            if ( self.cid ) {
                viblio.api('/services/faces/contact_mediafile_count?cid=' + self.cid).then( function( data ) {
                    self.hits(data.count);
                });
            } else {
                // can send a user uuid in args to get number of videos for specific user: {uid: uuid}
                viblio.api( '/services/mediafile/count', args ).then( function( data ) {
                    self.hits(data.count);
                });
            }
        },
        
        monthSelected: function( self, month ) {
            self.monthsLabels().forEach( function( m ) {
                m.selected( false );
            });
            month.selected( true );
            self.videos.removeAll();
            // reset pager
            self.monthPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };
            self.selectedMonth( month.label );
            self.monthVidsSearch( self.selectedMonth() );
            self.aMonthIsSelected(true);
            self.allVidsIsSelected(false);
            // get number of videos in selected month
            var args = {
                month: self.selectedMonth(),
                cid: self.cid
            };
            viblio.api( '/services/yir/videos_for_month', args )
                    .then(function(data){
                        self.vidsInSelectedMonth( data.media.length );
                    });
        },

        monthVidsSearch: function( month, year, cid ) {
            var self = this;
            var args = {
                month: month,
                year: year,
                cid: self.cid
            };
            self.isActiveFlag(true);
            return system.defer( function( dfd ) {
                if ( self.monthPager.next_page )   {
                    args.page = self.monthPager.next_page;
                    args.rows = self.monthPager.entries_per_page;
                    viblio.api( '/services/yir/videos_for_month', args )
                        .then( function( json ) {
                            self.monthPager = json.pager;
                            json.media.forEach( function( mf ) {
                                self.addMediaFile( mf );
                            });
                            dfd.resolve();
                        });
                }
                else {
                    dfd.resolve();
                }
            }).promise().then(function(){
                self.isActiveFlag(false);
            });
        },
        
        addMediaFile: function( mf ) {
            var self = this;

            // Create a new Mediafile with the data from the server
            var m = new Mediafile( mf, { show_share_badge: false } );
            
            m.on( 'mediafile:composed', function( e ) {
                $(e.view).draggable({
                    appendTo: '.albums',
                    scope: 'mediafile',
                    helper: 'clone',
                    scroll: true,
                    opacity: 0.75
                });
            });
            
            self.videos.push( m );
        },
        
        search: function() {
            var self = this;
            var apiCall;
            self.isActiveFlag(true);
            return system.defer( function( dfd ) {
                if ( self.allVidsPager.next_page )   {
                    apiCall = viblio.api( '/services/mediafile/list', 
                            { 
                                views: ['poster'],
                                page: self.allVidsPager.next_page, 
                                rows: self.allVidsPager.entries_per_page } );
                    
                    apiCall.then( function( json ) {
                            self.allVidsPager = json.pager;
                            json.media.forEach( function( mf ) {
                                self.addMediaFile( mf );
                            });
                            dfd.resolve();
                        });
                }
                else {
                    dfd.resolve();
                }
            }).promise().then(function(){
                self.isActiveFlag(false);
            });
        },
        
        showAllVideos: function() {
            var self = this;
            self.monthsLabels().forEach( function( m ) {
                m.selected( false );
            });
            self.aMonthIsSelected(false);
            self.allVidsIsSelected(true);
            self.videos.removeAll();
            // reset pager
            self.allVidsPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };
            self.search();
        },

	activate: function() {
            var self = this;
	    pager.next_page = 1;
            pager.total_entries = -1;
	    albums.removeAll();
            monthsLabels.removeAll();
            self.getHits();
            // get months and create labels to use as selectors
            viblio.api( '/services/yir/months' ).then( function(data) {
                data.months.forEach( function( month ) {
                    self.monthsLabels.push( { "label": month, "selected": ko.observable(false) } );
                });   
            });
	},

	compositionComplete: function() {
            var self = this;

	    // Fetch albums.  If none, create an initial fake album
            albumSearch();
            self.search();
	    // Infinite scroll support
	    $(view).find('.a-right-content').scroll( $.throttle( 250, function() {
		var $this = $(this);
		var height = this.scrollHeight - $this.height(); // Get the height of the div
		var scroll = $this.scrollTop(); // Get the vertical scroll position

		if ( searching() ) return;
		if ( height == 0 && scroll == 0 ) return;

		var isScrolledToEnd = (scroll >= height);

		if (isScrolledToEnd) {
                    albumSearch();
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
