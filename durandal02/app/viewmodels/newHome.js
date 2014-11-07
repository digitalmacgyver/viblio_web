define( ['plugins/router',
         'lib/viblio',
         'viewmodels/mediafile',
         'durandal/app',
         'durandal/events',
         'durandal/system',
         'lib/customDialogs',
         'lib/config',
         'viewmodels/hp',
         'viewmodels/pp',
         'viewmodels/photo'], 
    
    function( router,viblio, Mediafile, app, Events, system, dialog, config, hp, PlayerPage, Photo ) {

    var newHome = function( args ) {
	var self = this;
        
        // Go to a specific face - fid provided via link from an email
        self.goToFace = ko.computed( function() {
            if( args ) {
                if( args.fid ) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
        self.faceToGoTo = ko.computed(function(){
            if( args ) {
                if( args.fid ) {
                    return args.fid;
                } else {
                    return null;
                }
            } else {
                return null
            }
        });
        
        self.addAlbum = ko.computed( function() {
            if( args ) {
                if( args.addAlbum ) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
        
        self.showRecent = ko.computed( function() {
            if( args ) {
                if( args.recent ) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
        
        self.activateWithRegSearch = ko.observable( args ? false : true );
        
        self.windowWidth = ko.observable( $(window).width() );
        self.wideScreen = ko.computed( function() {
            if( self.windowWidth() > 1200 ) {
                return true;
            } else {
                return false;
            }
        });
        
        self.recentUploadsIsActive = ko.observable(false);
        
        self.show_find_options = ko.observable(false);
        self.select_all_mode_is_on = ko.observable(false);
        self.select_mode_on = ko.observable(false);
        self.select_mode_on.subscribe( function( val ) {
            // send a message to alert when select mode is on or not
            if( val ) {
                app.trigger( 'select_mode:on' );
            } else {
                app.trigger( 'select_mode:off' );
            }
        });
        self.share_mode_on = ko.observable(false);
        self.add_to_mode_on = ko.observable(false);
        self.delete_mode_on = ko.observable(false);
        self.create_new_vid_album_mode_on = ko.observable(false);
        self.add_to_existing_vid_album_mode_on = ko.observable(false);
        self.add_to_existing_blank_album_mode_on = ko.observable(false);
        self.create_facebook_album_mode_on = ko.observable(false);
        
        self.toolbarHeight = ko.observable( self.select_mode_on() ? $('.select-nav').height() : $('.vids-nav').height() );
        
        self.datesLabels  = ko.observableArray([]);
        self.showingAllDatesLabels = ko.observable(true);
        self.selectedMonth = ko.observable();
        self.dateFilterIsActive = ko.observable(false);
        
        self.facesLabels = ko.observableArray([]);
        self.selectedFace = ko.observable();
        self.selectedFace.subscribe( function( val ) {
            // send a message that says the face filter is active or not
            if( val ) {
                app.trigger( 'selectedFace:active', val );
            } else {
                app.trigger( 'selectedFace:notactive' );
            }
        });
        self.faceFilterIsActive = ko.observable(false);
        
        self.citiesLabels = ko.observableArray([]);
        self.selectedCity = ko.observable();
        self.cityFilterIsActive = ko.observable(false);
        
        self.albumLabels = ko.observableArray();
        self.selectedAddToAlbum = ko.observable();
        self.selectedAddToAlbumLabel = ko.observable();
        
        self.albumsFilterLabels = ko.observableArray();
        self.selectedFilterAlbum = ko.observable();
        self.currentSelectedFilterAlbum = ko.observable(null);
        self.albumFilterIsActive = ko.observable(false);
        self.albumFilterIsActive.subscribe( function( val ) {
            // send a message that says the album filter is not active
            if( !val ) {
                app.trigger( 'albumList:notactive' );
            }
        });
        self.currentAlbum = ko.observable(null);
        self.currentAlbum.subscribe( function( val ) {
            // send a message that includes the newly activated album object
            if( val ) {
                app.trigger( 'albumList:gotalbum', val );
            }
        });
        self.albumIsShared = ko.observable(null);
        self.currentAlbumAid = ko.observable(null);
        self.currentAlbumTitle = ko.observable(null);
        self.current_album_is_empty = ko.observable( null );
        
        // This handles the folder icon for an album - shows the shared icon when it's been shared
        app.on('album:album_shared', function( aid ) {
            if( self.currentAlbumAid() === aid ) {
                self.albumIsShared(true);
            }
        });
        
        // This handles the folder icon for an album - removes the shared icon when it's been unshared
        app.on('album:album_unshared', function( aid ) {
            if( self.currentAlbumAid() === aid ) {
                self.albumIsShared(false);
            }
        });
        
        // Search section
        self.searchFilterIsActive = ko.observable(false);
        self.searchQuery = ko.observable(null);
        self.currentSearch = null;
        
        self.noFiltersAreActive = ko.computed( function() {
            if( self.recentUploadsIsActive() || self.dateFilterIsActive() || self.faceFilterIsActive() || self.cityFilterIsActive() || self.albumFilterIsActive() ) {
                return false;
            } else {
                return true;
            }
        });
        
        self.aFilterIsActive = ko.computed( function() {
            if( self.recentUploadsIsActive() || self.dateFilterIsActive() || self.faceFilterIsActive() || self.cityFilterIsActive() || self.searchFilterIsActive() ) {
                return true;
            } else {
                return false;
            }
        });
        
        self.videos = ko.observableArray([]);
        self.photos = ko.observableArray([]);
        
        self.selectedVideos = ko.observableArray();
        self.selectedPhotos = ko.observableArray([]);
        
        self.shouldBeVisible = ko.computed(function() {
            if(self.videos().length >= 1) {
                return true;
            } else {
                return false;
            }
        });
        
        self.getVidsData = ko.observable();
        
        self.hits = ko.observable();
        
        self.hasCID = ko.computed(function() {
            if (self.cid) {
                return true;
            } else {
                return false;
            }
        });
                
        self.allVidsIsSelected = ko.observable( true );
        self.allVidsIsSelected.subscribe( function() {
            app.trigger( 'newHome:noFiltersAreActive' );
        });
        
        self.isActiveFlag = ko.observable(true);
        
        // Hold the pager data back from server
	// media queries.  Initialize it here so
	// the first fetch works.
        self.thePager = ko.observable({});
        
        self.active_filter_label = ko.computed( function() {
            if( self.dateFilterIsActive() ) {
                return self.selectedMonth();
            } else if( self.faceFilterIsActive() ) {
                return self.selectedFace().label;
            } else if( self.cityFilterIsActive() ) {
                return self.selectedCity();
            } else if( self.albumFilterIsActive() ) {
                return self.selectedFilterAlbum();
            } else if( self.searchFilterIsActive() ) {
                return self.searchQuery();
            } else if( self.recentUploadsIsActive() ) {
                return 'Recent';
            } else {
                return null;
            }
        });

        app.on('fscroll:seeAll', function( face ){
            self.faceSelected( self, self.findMatch( face.uuid, self.facesLabels() ) );
        });
        
        self.vidsInProcess = ko.observable( null );
        self.numVidsPending = ko.observable( null );
        self.showInProcessCount = ko.computed( function(){
            if( self.vidsInProcess() > 0 ) {
                return true;
            } else {
                return false;
            }
        });
        self.pendingVidsArr = ko.observableArray([]);
        
        self.showPopup = ko.observable( false );
        // content used for title of popover - adds close button so it can be dismissed
        self.btn = '<button type="button" class="close albumPopOverClose" onclick="$(&quot;.addToButton&quot;).popover(&quot;hide&quot;);">&times;</button>';
        self.pt = '<span><strong>How to Create an Album</strong></span>'+self.btn;      
        
        self.content = '<p>Albums are a great way to share groups of videos privately with friends, family or your community. \n\
                        If you’ve already uploaded videos to your library, start a new private sharing space for you and your friends.</p>\n\
                        <ul>\n\
                            <li>Click on the <strong>+ Add To</strong> button to the right</li>\n\
                            <li><strong>Create a New Album</strong> (or choose an existing album to add to)</li>\n\
                            <li><strong>Select</strong> your videos and press <strong>DONE</strong> in the Select Toolbar</li>\n\
                        </ul>';
        
        self.playingVid = ko.observable( null );
        self.playingVidUUID = ko.observable( null );
        self.playingVidIndex = ko.observable( null );
        
        self.visiblePhotosCount = ko.observable( 0 );
        self.video_mode_on = ko.observable( true );
        self.video_mode_on.subscribe( function( val ) {
            var old = self.photoViewFilter();
            self.photoViewFilter(null);
            self.photoViewFilter( old );
        });
        
        self.photoViewFilter = ko.observable( "some" );
        self.photoViewFilter.subscribe( function( val ) {
            //console.log( "photoViewFilter tickled" );
            // reset counter to 0
            self.visiblePhotosCount( 0 );
            if( val == "some" ) {
                self.photos().forEach( function( p ) {
                    if( p.filter() != "some" ) {
                        p.hideIt();
                    } else {
                        p.showIt();
                        self.visiblePhotosCount( self.visiblePhotosCount()+1 );
                    }
                });
            } else if ( val == "more" ) {
                self.photos().forEach( function( p ) {
                    if( p.filter() == "all" ) {
                        p.hideIt();
                    } else {
                        p.showIt();
                        self.visiblePhotosCount( self.visiblePhotosCount()+1 );
                    }
                });
            } else {
                self.photos().forEach( function( p ) {
                    p.showIt();
                    self.visiblePhotosCount( self.visiblePhotosCount()+1 );
                });
            }
        });
                
        app.on('nginxModal:closed2', function( args ) {
            if( document.location.hash == '#home' ) {
                viblio.api('services/mediafile/list_status').then( function( data ) {
                    //console.log( data );
                    self.numVidsPending( data.stats.pending );
                    var num = data.stats.pending/* + data.stats.visible*/;
                    self.vidsInProcess( num );
                    if( self.vidsInProcess() > 0 && args.uploadsCompleted ) {
                        self.getRecentVids( true );
                    }
                });
            }
        });
    };
    
    newHome.prototype.toggleVideoPhotoMode = function() {
        var self = this;
        
        //$('#myonoffswitch').trigger('click');
        console.log( $('#myonoffswitch').is(':checked') );
        //$('#myonoffswitch').is(':checked') ? $('#myonoffswitch').attr('checked', false) : $('#myonoffswitch').attr('checked', true);
        
        self.video_mode_on() ? self.video_mode_on(false) : self.video_mode_on(true);
    };
    
    newHome.prototype.getVidsInProcess = function() {
        var self = this;
        
        viblio.api('services/mediafile/list_status').then( function( data ) {
            //console.log( data );
            self.numVidsPending( data.stats.pending );
            var num = data.stats.pending/* + data.stats.visible*/;
            self.vidsInProcess( num );
        });
    };
    
    newHome.prototype.toggleRecentVids = function() {
        var self = this;
        
        if( self.recentUploadsIsActive() ) {
            self.recentUploadsIsActive( false );
            self.showAllVideos();
        } else {
            self.getRecentVids( true );
            self.recentUploadsIsActive( true );
            self.unselectOtherFilters();
        }
    };
    
    newHome.prototype.toggle_find_options = function() {
        var self = this;
        
        if( self.show_find_options() ) {
            self.show_find_options( false );
        } else {
            self.show_find_options( true );
        }
    };
    
    newHome.prototype.some_more_all = function( mf, images ) {
        var self = this;
        
        var face_threshold = 1;
        var gap_threshold = 15.5;
        var face_gap_threshold = 5;
        var prior_timecode = -99;
        
        var best_image_score = -1;
        var best_image = null;
        var some_count = 0;
        
        var results = [];
        
        for (var image in images) {
            if( !images[image] ) {
                return;
            }
            var timecode = images[image].timecode;
            var face_score = images[image].face_score;

            //Update the best image we've seen so far for this video.
            if ( face_score > best_image_score ) {
                best_image = images[image];
                best_image_score = face_score;
            }
            
            if( results.indexOf( images[image] ) < 0 ) {
                if ( face_score >= face_threshold && ( timecode - prior_timecode ) > gap_threshold ) {
                    //This image is in "some"
                    images[image].filter = "some";
                    results.push( images[image] );
                    some_count++;
                } else if ( ( timecode - prior_timecode ) > gap_threshold || ( ( face_score >= face_threshold ) && ( timecode - prior_timecode ) > face_gap_threshold ) ) {
                    //This image is in "more"
                    images[image].filter = "more";
                    results.push( images[image] );
                } else {
                    //Otherwise, this image belongs to "all"
                    images[image].filter = "all";
                    results.push( images[image] );
                }

                prior_timecode = timecode;   
            } 
        }
        
        // check to see if there are any "some" photos yet, if not then apply the "some" filter
        // to the best image for the video
        if( some_count == 0 ) {
            // first remove the image from the results array
            results.splice( results.indexOf( best_image ), 1 );
            // then re-add it with a filter of "some"
            best_image.filter = "some";
            results.push( best_image );
        }
        
        results.forEach( function( p ) {
            self.addPhoto( p, self.mfOwnedByViewer( mf ) ? { ownedByViewer: true } : { ownedByViewer: false, owner_uuid: mf.owner_uuid } ); 
        });
        self.photos.valueHasMutated();
    };
    
    newHome.prototype.monthSelected = function( self, month ) {
        var args;
        if( month.selected() ) {
            month.selected(false);
            self.showAllVideos();
        } else {
            self.datesLabels().forEach( function( m ) {
                m.selected( false );
            });
            month.selected( true );
            self.selectedMonth( month.label );
            args = {
                month: self.selectedMonth(),
                cid: self.cid
            };
            self.filterVidsSearch( 'dates', args, '/services/yir/videos_for_month', true );
            app.trigger( 'selectedFace:notactive' );
        }
    };
    
    newHome.prototype.faceSelected = function( self, face ) {      
        var gettingFace;
        var args;
        
        // Used to close the dropdown
        $("body").trigger("click");
        
        if( !gettingFace ) {
            gettingFace = true;
            if( face.selected() ) {
                face.selected(false);
                self.showAllVideos();
                gettingFace = false;
            } else {
                self.facesLabels().forEach( function( f ) {
                    f.selected( false );
                });
                face.selected( true );
                self.selectedFace( face );
                //self.faceVidsSearch( true );
                args = {
                    contact_uuid: self.selectedFace().uuid
                };
                self.filterVidsSearch( 'faces', args, '/services/faces/media_face_appears_in', true );
                gettingFace = false;
            }
        } else {
            return;
        }    
    };
        
    newHome.prototype.citySelected = function( self, city ) {
        var args;
        // Used to close the dropdown
        $("body").trigger("click");
        
        if( city.selected() ) {
            city.selected(false);
            self.showAllVideos();
        } else {
            self.citiesLabels().forEach( function( c ) {
                c.selected( false );
            });
            city.selected( true );
            self.selectedCity( city.label );
            //self.cityVidsSearch( true );
            args = {
                q: self.selectedCity()
            }
            self.filterVidsSearch( 'cities', args, '/services/mediafile/taken_in_city', true );
            app.trigger( 'selectedFace:notactive' );
        }         
    };
    
    newHome.prototype.newVidsSearch = function() {
        var self = this;
        var args;
        
        if ( !self.searchQuery() ) {
            return;
        } else {          
            self.searchFilterIsActive(true);
            self.videos.removeAll();
            self.photos.removeAll();
            self.currentSearch = self.searchQuery();
            args = {
                q: self.currentSearch
            };
            self.filterVidsSearch( null, args, '/services/mediafile/search_by_title_or_description', true );
            app.trigger( 'selectedFace:notactive' );
        }
    };
    
    newHome.prototype.getRecentVids = function( newSearch ) {
        var self = this;
        var args;
        
        args = {};
        if( self.vidsInProcess() > 0 ) {
            args.only_videos = 1;
            args['status[]'] = ['pending', 'visible', 'complete'];
        }
        self.filterVidsSearch( 'recent', args, '/services/mediafile/recently_uploaded', newSearch );
        app.trigger( 'selectedFace:notactive' );
    };
    
    newHome.prototype.showAllVideos = function() {
        var self = this;
        var args;
        var apiCall;
        
        self.searchFilterIsActive( false );
        self.allVidsIsSelected(true);
        
        args = {};
        if( self.cid ) {
            args = {
                contact_uuid: self.cid
            };
            apiCall = '/services/faces/media_face_appears_in';
        } else {
            args = { 
                views: ['poster']
            };
            apiCall = '/services/mediafile/list_all';
        }
        self.filterVidsSearch( 'all', args, apiCall, true );
        app.trigger( 'selectedFace:notactive' );
    };
    
    /*
     * @param {string} type - one of: "dates", "faces", "cities", "recent", "all" or null 
     * @param {object} args - the args to be sent along with the api call
     * @param {string} api - the endpoint to call
     * @param {bool} newSearch - whether or not to run a fresh search or not
     */
    newHome.prototype.filterVidsSearch = function( type, args, api, newSearch ) {
	var self = this;
        var media;
        self.isActiveFlag(true);
        
        // Only remove all vids and reset pager if it's a new search
        if( newSearch ) {
            //clear the search contents - only if there is a type - if type is null this means it's a search, so keep the current search term
            if( type ) {
                self.clearSearch();
            }
            
            if( !type || type == "all" || type == "recent" ) {
                self.clearfilters();
            }
            
            self.unselectOtherFilters(type);
            // reset pager
            self.thePager({
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            });    
        }
        
	return system.defer( function( dfd ) {
	    if ( self.thePager().next_page )   {
                args.page = self.thePager().next_page;
                args.rows = self.thePager().entries_per_page;
                args.include_tags = 1;
                args.include_contact_info = 1;
                args.include_images = 1;
		viblio.api( api, args )
		    .then( function( json ) {
                        self.hits ( json.pager.total_entries ? json.pager.total_entries : 0 );
			self.thePager(json.pager);
                        if(json.albums){
                            json.media = json.albums;
                        }
                        media = json.media;
                        json.media.forEach( function( mf ) {
                            self.addMediaFile ( mf );
                            if( mf.views.image ) {
                                self.some_more_all( mf, mf.views.image );
                            }
                        });
                        self.videos.valueHasMutated();
			dfd.resolve();
		    });
	    }
	    else {
		dfd.resolve();
	    }
	}).promise().then(function(){
            // reset active filters
            if( type && type != "all" ) {
                self.resetOtherFilters( type );
            }
            
            // this section handles the cover phots section - if the type is not all then show a slideshow
            if( type && type != "all" ) {
                app.trigger( 'newHome:filtersAreActive', media );
            }
            
            if( self.videos().length > 0 ) {
                $.when( self.videos()[self.videos().length-1].viewResolved ).then( function() {
                    self.isActiveFlag(false);
                });
            } else {
                self.isActiveFlag(false);
            }
            
            // tickle the photos filter
            var old = self.photoViewFilter();
            self.photoViewFilter(null);
            self.photoViewFilter( old );
            
            if( type == "all" ) {
                setTimeout(function(){
                    self.setTitleMargin();
                }, 300);    
            }
        });
    };
    
    newHome.prototype.clearSearch = function( andFilter ) {
        var self = this;
        
        self.searchFilterIsActive( false );
        self.searchQuery(null);
        self.videos.removeAll();
        self.photos.removeAll();
        
        if( andFilter ) {
            self.clearfilters();
        }
    };
    
    newHome.prototype.resetOtherFilters = function( exception ) {
        var self = this;
        
        self.dateFilterIsActive(false);
        self.faceFilterIsActive(false);
        self.cityFilterIsActive(false);
        self.recentUploadsIsActive(false);
        self.allVidsIsSelected(false);
        self.albumFilterIsActive(false);
        self.selectedFilterAlbum('');    
            
        if( exception == "dates" ) {
            self.dateFilterIsActive(true);
            self.selectedFace('');
            self.selectedCity('');
        } else if ( exception == "faces" ) {
            self.selectedMonth('');
            self.faceFilterIsActive(true);
            self.selectedCity('');
        } else if ( exception == "cities" ) {
            self.selectedMonth('');
            self.selectedFace('');
            self.cityFilterIsActive(true);
        } else if ( exception == "recent" ) {
            self.selectedMonth('');
            self.selectedFace('');
            self.selectedCity('');
            self.recentUploadsIsActive(true);
        }
    };
        
    newHome.prototype.albumVidsSearch = function( newSearch ) {
        var self = this;
        var album_id = self.currentAlbumAid();
        
        self.isActiveFlag(true);
        
        // Only remove all vids and reset pager if it's a new search
        if( newSearch ) {
            //clear the search contents
            self.clearSearch();
            self.unselectOtherFilters('albums');
        }
        
        return system.defer( function( dfd ) {
            viblio.api( 'services/album/get?aid=' + album_id + '&include_contact_info=1&include_tags=1&include_images=1' ).
                then( function( json ) {
                    //self.hits ( json.pager.total_entries );
                    //self.facesPager = json.pager;
                    self.currentAlbum( json.album );
                    self.albumIsShared( json.album.is_shared ? true : false );
                    if( json.album.media.length > 0 ) {
                        json.album.media.forEach( function( mf ) {
                            self.addAlbumMediaFile ( mf );
                            if( mf.views.image ) {
                                self.some_more_all( mf, mf.views.image );
                            }
                        });
                        self.videos.valueHasMutated();
                        dfd.resolve();
                    } else {
                        dfd.resolve();
                    }                                               
                });
        }).promise()
        // If the album has videos in it go to it!
          .done(function(){
            self.current_album_is_empty( false );
            // reset active filters
            self.recentUploadsIsActive(false);
            self.dateFilterIsActive(false);
            self.selectedMonth('');
            self.faceFilterIsActive(false);
            self.selectedFace('');
            self.allVidsIsSelected(false);
            self.cityFilterIsActive(false);
            self.selectedCity('');
            self.albumFilterIsActive(true);
            
            if( self.videos().length > 0 ) {
                $.when( self.videos()[self.videos().length-1].viewResolved ).then( function() {
                    self.isActiveFlag(false);
                });
            } else {
                self.isActiveFlag(false);
            }
            
            // tickle the photos filter
            var old = self.photoViewFilter();
            self.photoViewFilter(null);
            self.photoViewFilter( old );
        })
        // if the album is empty then show dialog, when button is clicked drop into select mode from all videos 
        .fail(function(){
            self.current_album_is_empty( true );
            self.selectedVideos.removeAll();
            
            dialog.showModal( 'viewmodels/emptyAlbumModal' ).then( function( data ) {
                if( data == 'Add Videos Now' ) {
                    self.showAllVideos();
                    //self.addToAlbumSelected( self, self.currentSelectedFilterAlbum() );
                    self.add_to_mode( 'existing-blank' );
                } else {
                    self.delete_album( true );
                }                  
            });
        });
    };
    
    newHome.prototype.addToEmptyAlbum = function() {
        var self = this;
        
        self.showAllVideos();
        self.add_to_mode( 'existing-blank' );
    };
    
    newHome.prototype.setSize = function() {
        $('.newHomeAlbumTitleEdit').width( $('.newHomeAlbumTitleView').width() );
    };
    
    app.on( 'album:name_changed', function( self ) {
        viblio.api( '/services/album/change_title', { aid: self.currentAlbumAid(), title: self.currentAlbumTitle() } ).then(function() {
            self.currentSelectedFilterAlbum().title = self.currentAlbumTitle();
            self.getAllAlbumsLabels();
        });
    });
    
    newHome.prototype.hidePopover = function() {
        var self = this;
        $(".addToButton").popover("hide");
        self.showPopup( false );
    };
    
    newHome.prototype.showMessage = function( type ) {
        var self = this;
        var msg;
        var showMessage = false;
        
        if( type === 'albums') {
            /*if( self.albumsFilterLabels().length === 0 ) {
                showMessage = true;
            }
            msg = "<p>You haven’t created any albums yet. Go back to your Library <img src='/css/images/messages/library.png'> and then click the Add To <img src='/css/images/messages/addTo.png'> button to start your first Album.</p>";*/
            showMessage = false;
            if( self.albumsFilterLabels().length === 0 ) {
                self.showPopup( true );
                $(".addToButton").popover("show");
                $('.albumPopOverClose').on('click', function(){
                    self.hidePopover();
                });
            }
        } else if ( type === 'people' ) {
            if( self.facesLabels().length === 0 ) {
                showMessage = true;
            }
            msg = "<p>You haven’t tagged any people in your videos yet. Go to Faces <img src='/css/images/messages/faces.png'> and tag some of the faces we found in your videos.";
        } else if ( type === 'places' ) {
            if( self.citiesLabels().length === 0 ) {
                showMessage = true;
            }
            msg = "<p>We haven’t identified any places in the videos you have uploaded yet, but you can tag your own places by clicking on any video and inserting the place where it was taken. <img src='/css/images/messages/location.png'></p>";
        }
        
        if( showMessage ) {
            dialog.showModal( 'viewmodels/customBlankModal', msg );
        }
    };
    
    newHome.prototype.seeSharedMembers = function() {
        var self = this;
        
        var album = ko.toJS ( self.currentSelectedFilterAlbum() );
        album.is_shared = 1;
        
        dialog.showShareAlbumModal( album );
    };
    
    newHome.prototype.addAlbumMediaFile = function( mf ) {
	var self = this;
        
	// Create a new Mediafile with the data from the server - Only albums owned by the viewer will be given the share badge

	var m = new Mediafile( mf, self.mfOwnedByViewer(mf) ? { show_share_badge: !self.select_mode_on(), show_preview: true, show_faces_tags: true, ownedByViewer: true, show_select_badge: self.select_mode_on(), selected: self.select_all_mode_is_on(), popup_player: true, clean_style: true } : { show_preview: true, ro: true, show_faces_tags: true, shared_style: true, owner_uuid: mf.owner_uuid, show_select_badge: self.select_mode_on(), selected: self.select_all_mode_is_on(), popup_player: true, clean_style: true } );	

	// Play a mediafile clip.  This uses the query parameter
	// passing technique to pass in the mediafile to play.
	/*m.on( 'mediafile:play', function( m ) {
	    if ( m.media().owner_uuid == viblio.user().uuid )
		router.navigate( 'new_player?mid=' + m.media().uuid );
	    else
		router.navigate( 'web_player?mid=' + m.media().uuid );
	});*/
        
        m.on( 'mediafile:play', function( m ) {
            self.playingVid( m );
            self.playingVidIndex( self.videos().indexOf( m ) );
            self.playingVidUUID( m.media().uuid );
	});

        m.on( 'mediafile:delete', function( m ) {
            viblio.api( '/services/album/remove_media?', { aid: self.currentAlbumAid(), mid: m.media().uuid } ).then( function() {
                viblio.mpEvent( 'remove_video_from_album' );
                // Remove from allVids
                self.videos.remove( m );
            });
        });
        
        m.on( 'mediafile:selected', function( m ) {
            // make sure video isn't already in the selectedVideos array
            if( self.selectedVideos().indexOf( m.media().uuid ) == -1 ) {
                self.selectedVideos.push( m.media().uuid ); 
            }              
        });

        m.on( 'mediafile:unselected', function( m ) {
            self.selectedVideos.remove( m.media().uuid );
            self.select_all_mode_is_on(false);
        });
        
        m.on( "mediaFile:TitleDescChanged", function() {
            //var uuid = this.view.id;
            var uuid = this.media().uuid;
            var title = this.title();
            // Update name in allVids no matter what
            self.videos().forEach(function( mf ) {
                if( mf.media().uuid == uuid ) {
                    mf.title( title );
                }
            });          
        });

	// Add it to the list - push directly into the underlying array, not the observable
        var innerArray = self.videos()
	innerArray.push( m );
    };
    
    // Add a new mediafile to our managed list of mediafiles
    newHome.prototype.addMediaFile = function( mf ) {
	var self = this;
        if( mf.status == 'failed' ) {
            return;
        }   
        if( mf.is_shared == 1 ) {
            // Shared with user
            var m = new Mediafile( mf, { ro: true, shared_style: true, owner_uuid: mf.owner_uuid, show_faces_tags: true, show_select_badge: self.delete_mode_on() ? self.select_mode_on() : false, selected: self.delete_mode_on() ? self.select_all_mode_is_on() : false, popup_player: true, clean_style: true } ); //m.ro( true );
            /*m.on( 'mediafile:play', function( m ) {
                router.navigate( 'web_player?mid=' + m.media().uuid );
            });*/
            m.on( 'mediafile:play', function( m ) {
                self.playingVid( m );
                self.playingVidIndex( self.videos().indexOf( m ) );
                self.playingVidUUID( m.media().uuid );
            });
            m.on( 'mediafile:delete', function( m ) {
                viblio.api( '/services/mediafile/delete_share', { mid: m.media().uuid } ).then( function( data ) {
                    viblio.mpEvent( 'delete_share' );
                    self.videos.remove( m );
                    self.hits( self.hits()-1 );
                });
            });    
        } else {
            // Owned by user
            var m = new Mediafile( mf, { show_share_badge: !self.select_mode_on(), show_select_badge: self.select_mode_on(), show_faces_tags: true, ownedByViewer: true, selected: self.select_all_mode_is_on(), in_process_style: mf.status == 'pending' ? true : false, popup_player: true, clean_style: true } );

            // Proxy the mediafile play event and send it along to
            // our parent.
            /*m.on( 'mediafile:play', function( m ) {
                router.navigate( 'new_player?mid=' + m.media().uuid );
            });*/
            m.on( 'mediafile:play', function( m ) {
                self.playingVid( m );
                self.playingVidIndex( self.videos().indexOf( m ) );
                self.playingVidUUID( m.media().uuid );
            });

            m.on( 'mediafile:delete', function( m ) {
                viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function( json ) {
                    viblio.mpEvent( 'delete_video' );
                    self.videos.remove( m );
                    self.hits( self.hits()-1 );
                    if ( json && json.contacts ) {
                        json.contacts.forEach( function( contact ) {
                            app.trigger( 'top-actor:remove', contact );
                        });
                    }
                });
            });
        } 
        
        m.on( 'mediafile:selected', function( m ) {
            // make sure video isn't already in the selectedVideos array
            if( self.selectedVideos().indexOf( m.media().uuid ) == -1 ) {
                self.selectedVideos.push( m.media().uuid ); 
            }             
        });

        m.on( 'mediafile:unselected', function( m ) {
            self.selectedVideos.remove( m.media().uuid );
            self.select_all_mode_is_on(false);
        });
        
	// Add it to the list - push directly into the underlying array, not the observable
        var innerArray = self.videos()
	innerArray.push( m );
        
        // If select all mode is on when new vids are added then add them to the selected array too - only if owned by viewer
        if( self.select_all_mode_is_on() && self.select_mode_on() ) {
            if( self.delete_mode_on() ){
                self.selectedVideos.push( m.media().uuid );
            } else {
                if( self.mfOwnedByViewer( m ) ) {
                    self.selectedVideos.push( m.media().uuid );
                }    
            }
        } 
    };
    
    newHome.prototype.addPhoto = function( ph, options ) {
	var self = this;
        
	// Create a new Photo with the data from the server
	var p = new Photo( ph, options.ownedByViewer ? { ownedByViewer: true, show_select_badge: self.select_mode_on(), selected: self.select_all_mode_is_on() } : { owner_uuid: options.owner_uuid, show_select_badge: self.delete_mode_on() ? self.select_mode_on() : false, selected: self.delete_mode_on() ? self.select_all_mode_is_on() : false } );

	// Register a callback for when a Mediafile is selected.
	// This is so we can deselect the previous one to create
	// a radio behavior.
	p.on( 'photo:selected', function( p ) {
            // make sure video isn't already in the selectedVideos array
            if( self.selectedPhotos().indexOf( p.media().uuid ) == -1 ) {
                self.selectedPhotos.push( p.media().uuid );
            }              
        });

        p.on( 'photo:unselected', function( p ) {
            self.selectedPhotos.remove( p.media().uuid );
            self.select_all_mode_is_on(false);
        });

	p.on( 'photo:play', function( p ) {
            //console.log( $(p.view).find('img') );
            //$(p.view).find('img').magnificPopup({type:'image'});
	});
        
        p.on( 'photo:delete', function( p ) {
            viblio.api( 'services/mediafile/delete_assets', { 'assets[]': p.media().uuid } ).then( function( json ) {
                viblio.mpEvent( 'delete_photo' );
                self.photos.remove( p );
                self.visiblePhotosCount( self.visiblePhotosCount()-1 );
            });
        });

        // Add it to the list - push directly into the underlying array, not the observable
        var innerArray = self.photos()
	innerArray.push( p );
        
        // If select all mode is on when new photos are added then add them to the selected array too - only if owned by viewer
        if( self.select_all_mode_is_on() && self.select_mode_on() ) {
            if( self.delete_mode_on() ){
                if( self.photoViewFilter() == "some" ) {
                    if( p.filter() == "some" ) {
                        self.selectedPhotos.push( p.media().uuid );
                    }
                } else if ( self.photoViewFilter() == "more" ) {
                    if( p.filter() != "all" ) {
                        self.selectedPhotos.push( p.media().uuid );
                    }
                } else {
                    self.selectedPhotos.push( p.media().uuid );
                }
            } else {
                if( options.ownedByViewer ) {
                    if( self.photoViewFilter() == "some" ) {
                        if( p.filter() == "some" ) {
                            self.selectedPhotos.push( p.media().uuid );
                        }
                    } else if ( self.photoViewFilter() == "more" ) {
                        if( p.filter() != "all" ) {
                            self.selectedPhotos.push( p.media().uuid );
                        }
                    } else {
                        self.selectedPhotos.push( p.media().uuid );
                    }
                }    
            }
        } 
    };
    
    newHome.prototype.mfOwnedByViewer = function( mf ) {
        var uuid;
        if( mf.owner_uuid ){
            uuid = mf.owner_uuid;
        } else if( mf.media().owner_uuid ){
            uuid = mf.media().owner_uuid;
        }
        
        if( uuid === viblio.user().uuid ){
            return true;
        } else {
            return false;
        } 
    };
    
    // Toggle videos to select mode
    newHome.prototype.activate_select_mode = function( allVids ) {
	var self = this;
        
        self.select_mode_on(true);
        // set margin above title so it's not burried by toolbar
        setTimeout(function(){
            self.setTitleMargin();
        }, 300);
        
        // for video mode
        if( self.video_mode_on() ) {
            // if allVids is passed then show select for ALL vids (including those not owned by the user)
            if( allVids ) {
                self.videos().forEach( function( mf ) {
                    mf.turnOnSelectMode();
                });    
            }
            // else just show it for the user owned vids
            else {
                self.videos().forEach( function( mf ) {
                    if( self.mfOwnedByViewer(mf) ) {
                        mf.turnOnSelectMode();
                    }
                });    
            }
        }
        // for photo mode
        else {
            /*if( !self.delete_mode_on() ) {
                self.photos().forEach( function( photo ) {
                    //console.log( photo );
                    if( photo.options.ownedByViewer ) {
                        photo.turnOnSelectMode();
                    }
                });    
            } else {
                self.photos().forEach( function( photo ) {
                    photo.turnOnSelectMode();
                }); 
            }*/
            self.photos().forEach( function( photo ) {
                //console.log( photo );
                if( photo.options.ownedByViewer ) {
                    photo.turnOnSelectMode();
                }
            });
        }
              
    };
    
    newHome.prototype.deactivate_select_mode = function() {
	var self = this;
        
        self.select_mode_on(false);
        // set margin above title so it's not burried by toolbar
        setTimeout(function(){
            self.setTitleMargin();
        }, 300);
        
        // for video mode
        if( self.video_mode_on() ) {
            self.videos().forEach( function( mf ) {
                mf.turnOffSelectMode();
            });
        }
        // for photo mode
        else {
            self.photos().forEach( function( photo ) {
                photo.turnOffSelectMode();
            });    
        }
        
    };
    
    newHome.prototype.clear_all_modes = function() {
        var self = this;
        
        self.share_mode_on(false);
        self.add_to_mode_on(false);
        self.delete_mode_on(false);
        self.create_new_vid_album_mode_on(false);
        self.add_to_existing_vid_album_mode_on(false);
        self.add_to_existing_blank_album_mode_on(false);
        self.create_facebook_album_mode_on(false);
    };
    
    newHome.prototype.share_mode = function() {
        var self = this;
        
        //self.activate_select_mode();
        self.clear_all_modes();
        self.share_mode_on(true);
        dialog.showShareAlbumModal( self.currentSelectedFilterAlbum() );
    };
    
    newHome.prototype.add_to_mode = function( type ) {
        var self = this;
        
        self.activate_select_mode();
        //only select all vids if the recent filter is on
        if( self.recentUploadsIsActive() ) {
            self.selectAll();
        }
        self.clear_all_modes();
        if( type == "new" ) {
            self.create_new_vid_album_mode_on(true);
        }
        if( type == "existing" ) {
            self.add_to_existing_vid_album_mode_on(true);
        }
        if( type == "existing-blank" ) {
            self.add_to_existing_blank_album_mode_on(true);
        }
        if( type == 'facebook' ) {
            self.create_facebook_album_mode_on(true);
        }
        self.add_to_mode_on(true);
    };
    
    newHome.prototype.delete_mode = function() {
        var self = this;
        
        self.clear_all_modes();
        self.delete_mode_on(true);
        
        // If an album is selected AND it's not owned by the user then only select user's vids
        if( self.albumFilterIsActive() && self.currentSelectedFilterAlbum().shared == 1 ) {
            self.activate_select_mode();
        } 
        // else select ALL vids - those owned by the user and shared with the user
        else {
            self.activate_select_mode(true);
        }
    };
    
    newHome.prototype.delete_album = function( album_is_empty ) {
        var self = this;
        var message
        var hp = require('viewmodels/hp');
        
        if( self.currentSelectedFilterAlbum().shared == 0 ) {
            // owned by viewer - delete
            message = 'If you delete this album, individual videos are not deleted, but no one you <br />shared this album with will be able to see this collection anymore. <br /> Do you want to continue?';
            app.showMessage( message, 'Delete Confirmation', ['Yes', 'No']).then( function( data ) {
                if( data == 'Yes' ) {
                    viblio.api( '/services/album/delete_album', { aid: self.currentSelectedFilterAlbum().uuid } ).then( function() {
                        viblio.mpEvent( 'delete_album' );
                        hp.albumList().albumsFilterLabels.remove( self.currentSelectedFilterAlbum() );
                        self.albumLabels().forEach( function( album ) {
                            if( album.uuid == self.currentSelectedFilterAlbum().uuid ) {
                                self.albumLabels.remove( album );
                                return;
                            }
                        });
                        self.showAllVideos();
                    });    
                } else {
                    if( album_is_empty == true ) {
                        self.showAllVideos();
                    } else {
                        return;
                    }
                }                   
            });
        } else {
            // owned by another viblio user - remove share
            message = 'If you remove this album, you will no longer be subscribed<br /> to any content the album owner adds to it. <br /> Do you want to continue?';
            app.showMessage( message, 'Delete Confirmation', ['Yes', 'No']).then( function( data ) {
                if( data == 'Yes' ) {
                    viblio.api( '/services/album/remove_me_from_shared', { aid: self.currentSelectedFilterAlbum().uuid } ).then( function() {
                        viblio.mpEvent( 'delete_album' );
                        hp.albumList().albumsFilterLabels.remove( self.currentSelectedFilterAlbum() );
                        self.albumLabels().forEach( function( album ) {
                            if( album.uuid == self.currentSelectedFilterAlbum().uuid ) {
                                self.albumLabels.remove( album );
                                return;
                            }
                        });
                        self.showAllVideos();
                    });    
                } else {
                    if( album_is_empty == true ) {
                        self.showAllVideos();
                    } else {
                        return;
                    }
                }                 
            });
        }
    };
    
    newHome.prototype.handle_delete = function( dfd ) {
        var self = this;
        
        var len = self.video_mode_on() ? self.selectedVideos().length : self.selectedPhotos().length;
        var albumOrAccount = self.albumFilterIsActive() ? 'this album' : 'your account';
        var message = 'Are you sure you want to remove ' + len + ( len == 1 ? (self.video_mode_on() ? ' video' : ' photo') :  (self.video_mode_on() ? ' videos' : ' photos') ) + ' from ' + albumOrAccount + '?';
        
        if( len > 0 ) {
            app.showMessage( message, 'Delete Confirmation', ['Yes', 'No']).then( function( data ) {
                if( data == 'Yes' ){
                    // videos
                    if( self.video_mode_on() ) {
                        self.videos().forEach( function( mf ) {
                            if( mf.selected() ) {
                                mf.mfdelete();
                            }
                        });
                        dfd.resolve();
                    }
                    // photos
                    else {
                        self.photos().forEach( function( p ) {
                            if( p.selected() ) {
                                p.pdelete();
                            }
                        });
                        dfd.resolve();
                    }
                } else {
                    dfd.reject();
                }
            });    
        } else {
            dfd.resolve();
        }
        
    };
    
    newHome.prototype.handle_share = function( dfd ) {
        var self = this;
        
        var list = self.selectedVideos();
        
        if ( self.selectedVideos().length > 0 ) {
            dialog.showShareNewAlbumModal( list, { newAlbumName: self.active_filter_label(), user: viblio.user() } ).then( function( data ) {
                dfd.resolve();
            });
        } else {
            dfd.reject();
        }
    };
    
    newHome.prototype.clean_up_after_select_mode = function() {
        var self = this;
        
        // turn off select all mode
        self.select_all_mode_is_on( false );
        // hide select boxes from vids
        self.deactivate_select_mode();
        // make sure all vids are unselected
        self.videos().forEach( function( mf ) {
            mf.selected( false );
        });
        // set all modes to false
        self.clear_all_modes();
        // clear selected vids array
        self.selectedVideos.removeAll();
        // clear selected photos array
        self.selectedPhotos.removeAll();
    };
    
    newHome.prototype.done_with_select_mode = function() {
        var self = this;
                
        if ( self.share_mode_on() ) {
            // show updated share modal with album naming area, create a new album out of all
            // selected vids, then share that album with everyone in the list of addresses
            return system.defer( function( dfd ) {
                self.handle_share( dfd );
            }).promise().done( function() {
                self.getAllAlbumsLabels();
                self.clean_up_after_select_mode();    
            }).fail( function() {
                self.cancel_select_mode();
            });            
        } else if( self.add_to_mode_on() ) {
            // Add all selected vids to selected album or create new album from selected vids
            // video mode on
            if( self.video_mode_on() ){
                return system.defer( function( dfd ) {
                    self.addOrCreateAlbum( dfd );
                }).promise().done( function() {
                    //self.getAllAlbumsLabels();
                    self.clean_up_after_select_mode();    
                }).fail( function() {
                    self.cancel_select_mode();
                });
            }
            // photo mode on
            else {
                // create facebook album, then present a link to the album in a modal or show an error
                if( self.create_facebook_album_mode_on() ) {
                    return system.defer( function( dfd ) {
                        self.create_fb_album( dfd );
                    }).promise().done( function( link ) {
                        dialog.showModal( 'viewmodels/facebookAlbumLinkModal', link ).then( function() {
                            self.clean_up_after_select_mode();
                        });
                    }).fail( function() {
                        dialog.showModal( 'viewmodels/customBlankModal', 'We\'re sorry. Facebook is unable to complete your request at this time. Please try again later.' ).then( function() {
                            self.cancel_select_mode();
                        });
                    });
                }
            }
            
        } else if ( self.delete_mode_on() ) {
            return system.defer( function( dfd ) {
                self.handle_delete( dfd );
            }).promise().done( function() {
                self.clean_up_after_select_mode();    
            });
        } else {
            self.cancel_select_mode();
        }     
    };
    
    newHome.prototype.cancel_select_mode = function() {
        var self = this;
        var hp = require('viewmodels/hp');
        // set all modes to false
        self.clear_all_modes();
        // turn off select all mode
        self.select_all_mode_is_on( false );
        // hide select boxes from vids
        self.deactivate_select_mode();
        // make sure all vids are unselected
        self.videos().forEach( function( mf ) {
            mf.selected( false );
        });
        // make sure all photos are unselected
        self.photos().forEach( function( p ) {
            p.selected( false );
        });
        // unselect the currently selected "add to" album
        self.selectedAddToAlbumLabel( null );
        self.selectedAddToAlbum( null );
        self.albumLabels().forEach( function( a ) {
            a.selected( false );
        });
        
        if( self.current_album_is_empty() ) {
            self.albumFilterIsActive( false );
            self.selectedFilterAlbum( null );
            self.currentSelectedFilterAlbum( null );
            hp.albumList().unselectAllAlbums();
        }
        // clear selected vids array
        self.selectedVideos.removeAll();
        // clear selected vids array
        self.selectedPhotos.removeAll();
    };
    
    newHome.prototype.unselectOtherFilters = function( currentFilter ) {
        var self = this;
        
        if( currentFilter !== 'dates' ) {
            self.datesLabels().forEach( function( m ) {
                m.selected( false );
            });
        }
        
        if( currentFilter !== 'faces' ) {
            self.facesLabels().forEach( function( f ) {
                f.selected( false );
            });    
        }
        
        if( currentFilter !== 'cities' ) {
            self.citiesLabels().forEach( function( c ) {
                c.selected( false );
            });    
        }
        
        if( currentFilter !== 'albums' ) {
            self.albumsFilterLabels().forEach( function( c ) {
                c.selected( false );
            });
            var hp = require('viewmodels/hp');
            if( hp.albumList() ){
                hp.albumList().unselectAllAlbums();
            }
        }
    };
    
    newHome.prototype.clearfilters = function() {
        var self = this;
        // reset active filters
        self.recentUploadsIsActive(false);
        self.dateFilterIsActive(false);
        self.selectedMonth('');
        self.faceFilterIsActive(false);
        self.selectedFace('');
        self.allVidsIsSelected(false);
        self.cityFilterIsActive(false);
        self.selectedCity('');
        self.albumFilterIsActive(false);
        self.selectedFilterAlbum('');
    };
    
    newHome.prototype.nameMonths = function( month ) {
        var self = this;
        
        var shortName;
        var longName;
        var year;
        
        if ( month != 'Missing dates' ) {
            shortName = month.slice(0,3);
            longName = month.slice(0, month.indexOf(' '));
            year = month.slice(month.length-4);
        } else {
            shortName = 'No';
            longName = '';
            year = 'Dates';
        }
        self.datesLabels.push( { shortMonth: shortName, longMonth: longName, year: year, label: month, selected: ko.observable(false) } );        
    };
    
    newHome.prototype.getAllDatesLabels = function() {
        var self = this;
        var args = {};
        args = {
            cid: self.cid
        };
        self.datesLabels.removeAll();
        viblio.api( '/services/yir/months', args ).then( function(data) {
            data.months.forEach( function( month ) {
                self.nameMonths( month );
            });
            self.showingAllDatesLabels( true );
        });
    };
    
    newHome.prototype.getAllFacesLabels = function() {
        var self = this;
        var args = {};
        args = {
            cid: self.cid
        };
        self.facesLabels.removeAll();
        var gettingFaceLabels = false;
        
        if( gettingFaceLabels === false ) {
            gettingFaceLabels = true;
            
            return system.defer( function( dfd ) {
                viblio.api( '/services/faces/contacts', args ).then( function(data) {
                    data.faces.forEach( function( face ) {
                        var _face = face;
                        _face.label = face.contact_name;
                        _face.selected = ko.observable( false );

                        self.facesLabels.push( _face );
                    });
                    dfd.resolve();
                });
                gettingFaceLabels = false;
            }).promise();
        } else {
            return;
        }        
    };
    
    newHome.prototype.getAllCityLabels = function() {
        var self = this;
        self.citiesLabels.removeAll();
        viblio.api( '/services/mediafile/cities' ).then( function(data) {
            data.cities.forEach( function( city ) {
                var _city = {};
                _city.label = city;
                _city.selected = ko.observable( false );
                self.citiesLabels.push( _city );
            });
        });
    };
    
    newHome.prototype.getAllAlbumsLabels = function() {
        var self = this;
        self.albumLabels.removeAll();
        //self.albumsFilterLabels.removeAll();
        return system.defer( function( dfd ) {
            viblio.api( '/services/album/album_names').then( function(data) {
                var arr = [];
                data.albums.forEach( function( album ) {
                    var _album = album;
                    _album.label = album.title;
                    _album.selected = ko.observable( false );
                    _album.shared = album.is_shared;
                    arr.push( _album );
                });

                //alphabetically sort the list - toLowerCase() makes sure this works as expected
                arr.sort(function(left, right) { return left.label.toLowerCase() == right.label.toLowerCase() ? 0 : (left.label.toLowerCase() < right.label.toLowerCase() ? -1 : 1) });
                self.albumLabels( arr );
                // add the create album option at the top of the list
                self.albumLabels.unshift( {label: "Create New Album", selected: ko.observable(false)} );
                
                var hp = require('viewmodels/hp');
                // if the album filter is active then pass in the aid of the current album so it can be highlighted via albumList.js
                if( hp.albumList() ) {
                    hp.albumList().getAllAlbumsLabels( self.albumFilterIsActive() ? self.currentAlbumAid() : null ).then( function() {
                        dfd.resolve();
                    });
                }
            });    
        }).promise();
    };
    
    newHome.prototype.selectAll = function() {
        var self = this;
        
        self.select_all_mode_is_on( true );
        // for video mode
        if( self.video_mode_on() ) {
            if( self.delete_mode_on() ) {
                if( self.albumFilterIsActive() ) {
                    // if the current album has been shared with the user only allow them to delete their own videos
                    if( self.currentSelectedFilterAlbum().shared ) {
                        self.videos().forEach( function(video) {
                            if( self.mfOwnedByViewer(video) && video.media().status == 'complete' ) {
                                video.select();
                            }
                        });    
                    }
                    // else it's their album - they can remove any videos
                    else {
                        self.videos().forEach( function(video) {
                            if( video.media().status == 'complete' ) {
                                video.select();
                            }
                        });
                    }
                } else {
                    self.videos().forEach( function(video) {
                        if( video.media().status == 'complete' ) {
                            video.select();
                        }
                    });
                }
            } else {
                self.videos().forEach( function(video) {
                    if( self.mfOwnedByViewer(video) && video.media().status == 'complete' ) {
                        video.select();
                    }
                });
            }
        } 
        // for photo mode
        else {
            /*if( self.delete_mode_on() ) {
                self.photos().forEach( function( photo ) {
                    if( !photo.hidden() ) {
                        photo.select();
                    }
                });
            } else {
                self.photos().forEach( function( photo ) {
                    if( photo.options.ownedByViewer && !photo.hidden() ) {
                        photo.select();
                    }
                });
            }*/
            self.photos().forEach( function( photo ) {
                if( photo.options.ownedByViewer && !photo.hidden() ) {
                    photo.select();
                }
            });
        }  
    };
    
    newHome.prototype.unselectAll = function() {
        var self = this;
        
        self.select_all_mode_is_on( false );
        // for video mode
        if( self.video_mode_on() ) {
            self.videos().forEach( function(video) {
                video.unselect();
            });
            self.selectedVideos.removeAll();
        }
        // for photo mode
        else {
            self.photos().forEach( function( photo ) {
                photo.unselect();
            });
            self.selectedPhotos.removeAll();
        }
    };
    
    newHome.prototype.getSelectedVidUUIDs = function( view ) {
        var self = view;
        
        if ( self.selectedVideos().length > 0 ) {
            self.selectedVideos.removeAll();
        }
        
        self.videos().forEach(function(vid) {
            if( vid.selected() ) {
                self.selectedVideos.push(vid.media().uuid);
            }
        });
    };
    
    newHome.prototype.createAlbumFromTitle = function() {
        var self = this;
        
        self.albumLabels()[0].selected(true);
        self.addToAlbumSelected( self, self.albumLabels()[0] );
    };
    
    newHome.prototype.addToAlbumSelected = function( self, album ) {
        //console.log( 'addToAlbumSelected fired', self, album )
        self.albumLabels().forEach( function( a ) {
            a.selected( false );
        });
        album.selected( true );
        self.selectedAddToAlbum( album );
        self.selectedAddToAlbumLabel( album.label );
        self.add_to_mode();
        
        // Used to close the dropdown
        $("body").trigger("click");
    };
    
    newHome.prototype.getAlbumName = function() {
        var self = this;
        
        if( self.noFiltersAreActive() ) {
            if( self.searchQuery() ) {
                return self.searchQuery();
            } else {
                return "New album";
            }           
        } else {
            if( self.recentUploadsIsActive() ) {
                return 'Recent Uploads';
            } else if( self.dateFilterIsActive() ) {
                return self.selectedMonth();
            } else if( self.faceFilterIsActive() ) {
                return self.selectedFace().contact_name;
            } else if( self.albumFilterIsActive() ) {
                return self.selectedFilterAlbum();    
            } else {
                return self.selectedCity();
            }
        }
    };
    
    newHome.prototype.findMatch = function( find, inArray ) {
        var self = this;
        
        var match = ko.utils.arrayFirst( inArray, function( a ) {
            return a.uuid === find;
        });
        if (match) {
            return match;  
        } else {
            return 'Error';
        }    
    };
    
    newHome.prototype.addOrCreateAlbum = function( dfd ) {
        var self = this;
        var num = self.selectedVideos().length;
        var hp = require('viewmodels/hp');
        if ( self.selectedVideos().length > 0 ) {
            // Create a new album
            if( self.create_new_vid_album_mode_on() ) {
                viblio.api( '/services/album/create', { name: self.getAlbumName(), list: self.selectedVideos() } ).then( function( data ) {
                    var vidOrVids = num == 1 ? ' video' : ' videos';
                    var msg = num + vidOrVids + ' successfully added to your new "' + data.album.title + '" Album';
                    viblio.notify( msg, 'success' );
                    
                    self.getAllAlbumsLabels().then( function() {
                        hp.albumList().albumFilterSelected( hp.albumList(), self.findMatch( data.album.uuid, hp.albumList().albumsFilterLabels() ) );
                    });
                    dfd.resolve();
                });
            }
            // Add to an existing album that will be chosen from a list
            else {
                function handleAdd( album ) {
                    viblio.api( '/services/album/add_media', { aid: album.uuid, list: self.selectedVideos() } ).then( function( data ) {
                        var vidOrVids = num == 1 ? ' video' : ' videos';
                        var msg = num + vidOrVids + ' successfully added to your "' + album.label + '" Album';
                        viblio.notify( msg, 'success' );
                        hp.albumList().albumFilterSelected( hp.albumList(), self.findMatch( album.uuid, hp.albumList().albumsFilterLabels() ) );
                        dfd.resolve();
                    });
                }
                
                // Add to an existing BLANK album
                if( self.add_to_existing_blank_album_mode_on() ) {
                    handleAdd( self.currentSelectedFilterAlbum() );
                }
                // show new dialog with list of all albums, once an album is selected then handle the add...
                else if( self.add_to_existing_vid_album_mode_on() ) {
                    dialog.showModal( 'viewmodels/albumListModal' ).then( function( album ) {
                        if( album ) {
                            handleAdd( album );
                        }                  
                    });    
                }
            }    
        } else {
            dfd.reject();
        }
    };
    
    newHome.prototype.create_video_summary = function() {
        var self = this;
        
        if( selectedPhotos().length > 0 ) {
            var args = {
                'images[]': selectedPhotos(),
                'summary_type' : 'moments',
                'title': albumTitle() + ' Summary Video'
            };

            viblio.api( 'services/mediafile/create_video_summary', args ).then( function( response ) {
                //console.log( response );
                self.getRecentVids();
            });
        }
    };
    
    newHome.prototype.create_fb_album = function( dfd ) {
        var self = this;
        
        if( self.selectedPhotos().length > 0 ) {
            var fb_appid   = config.facebook_appid();
            var fb_channel = config.facebook_channel();

            FB.init({
                appId: fb_appid,
                channelUrl: fb_channel,
                status: true,
                cookie: true,
                xfbml: true
            });

            var args = {
                'images[]': self.selectedPhotos(),
                title: self.getAlbumName()
            };
            
            FB.login(function(response) {
                if ( response.authResponse ) {
                    args.access_token = response.authResponse.accessToken;
                    viblio.api( 'services/mediafile/create_fb_album', args ).then( function( response ) {
                        var url = response.fb_album_url;
                        if( url ) {
                            dfd.resolve( url );
                        } else {
                            dfd.reject();
                        }
                    });
                } else {
                    dfd.reject();
                }
            },{scope: config.facebook_ask_features()});
        }
    };

    // bind to scroll() event and when scroll is 150px or less from bottom fetch more data.
    // Uses flag to determine if fetch is already in process, if so a new one will not be made 
    newHome.prototype.scrollHandler = function( event ) {
        var self = event.data;
        var args;
        var apiCall;
        
        if ( !self.noFiltersAreActive() ) {
            if( self.recentUploadsIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.getRecentVids();
                }
            } else if ( self.dateFilterIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    args = {
                        month: self.selectedMonth(),
                        cid: self.cid
                    };
                    self.filterVidsSearch( 'dates', args, '/services/yir/videos_for_month' );
                }
            } else if( self.faceFilterIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    args = {
                        contact_uuid: self.selectedFace().uuid
                    };
                    self.filterVidsSearch( 'faces', args, '/services/faces/media_face_appears_in' );
                }
            } else if( self.cityFilterIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    args = {
                        q: self.selectedCity()
                    }
                    self.filterVidsSearch( 'cities', args, '/services/mediafile/taken_in_city' );
                }
            }    
        } else {
            if( self.searchFilterIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    args = {
                        q: self.currentSearch
                    };
                    self.filterVidsSearch( null, args, '/services/mediafile/search_by_title_or_description' );
                }    
            } else {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    if( self.cid ) {
                        args = {
                            contact_uuid: self.cid
                        };
                        apiCall = '/services/faces/media_face_appears_in';
                    } else {
                        args = { 
                            views: ['poster']
                        };
                        apiCall = '/services/mediafile/list_all';
                    }
                    self.filterVidsSearch( 'all', args, apiCall );
                } 
            }
        }
    };
    
    newHome.prototype.setTitleMargin = function() {
        var self = this;
        self.toolbarHeight( self.select_mode_on() ? $('.select-nav').height() : $('.vids-nav').height() );
        var marginTop = self.toolbarHeight() > 43 ? 50 + (self.toolbarHeight() - 43) : 50;
        $('.newHomeTitle-Wrap').css('margin-top', marginTop );
    };
        
    newHome.prototype.stickyDates = function( event ) {
        var self = event.data;
        
        // If the window width is above 900 then add header and toobar heights, else just use toolbar height
        var maxPos = $(window).width() >= 900 ? 65 + self.toolbarHeight() : self.toolbarHeight();
        
        var scrollTop = $(window).scrollTop(),
        elementOffset = $('.dates').offset().top,
        distance      = (elementOffset - scrollTop),
        footerHeight  = ( $('#footer').offset().top ) - scrollTop;
        
        // add stuck class and set top css based on maxPos
        $('.dates').addClass('stuck').css('top', maxPos );
        // set margin above title so it's not burried by toolbar
        self.setTitleMargin();
        
        if( distance <= maxPos ){    
            // keep the dates section above the footer
            if ( $(window).width() >= 900 ) {
                $('.dates').css( { 'height': footerHeight - 108, 'max-height': $(window).height() - 108 } );
            } else {
                $('.dates').css( { 'height': footerHeight, 'max-height': $(window).height() } );
            }            
        }
        
        // code to remove stuck class
        if ( ( $('.allVidsInner').offset().top ) - scrollTop >= maxPos ){
            $('.dates').removeClass('stuck').css('top', 0);
            $('.dates').css( { 'height': '100%' } );
        }
    };
    
    newHome.prototype.stickyToolbars = function() {       
        var maxPos = 65; //height of header
        
        var scrollTop = $(window).scrollTop(),
        elementOffset = $('.toolbar').offset().top,
        distance      = (elementOffset - scrollTop);
        
        //console.log( distance );
        //console.log( $('.allVidsPage').offset().top - scrollTop );
        
        if ( $(window).width() >= 900 ) {
            if( distance <= maxPos ){
                $('.toolbar').addClass('stuck');            
            }
            if ( $('.allVidsPage').offset().top - scrollTop >= 65 ) {
                $('.toolbar').removeClass('stuck');
            } 
        } else {
            if( distance <= 0 ){
                $('.toolbar').addClass('stuck');            
            }
            if ( $('.allVidsPage').offset().top - scrollTop >= 0 ) {
                $('.toolbar').removeClass('stuck');
            }       
        }
        
    };

    newHome.prototype.getWindowWidth = function( event ) {
        var self = event.data;
        self.windowWidth( $(window).width() );
        self.toolbarHeight( self.select_mode_on() ? $('.select-nav').height() : $('.vids-nav').height() );
    };
    
    newHome.prototype.attached = function() {
	$(window).scroll( this, this.scrollHandler );
        $(window).scroll( this, this.stickyDates );
        $(window).scroll( this, this.stickyToolbars );
        $(window).resize( this, this.getWindowWidth );
        $(window).resize( this, this.stickyDates );
        $(window).resize( this, this.resizePlayer );
    };

    newHome.prototype.detached = function() {
	$(window).off( "scroll", this.scollHandler );
        $(window).off( "scroll", this.stickyDates );
        $(window).off( "scroll", this.stickyToolbars );
        $(window).off( "resize", this.getWindowWidth );
        $(window).off( "resize", this.stickyDates );
        $(window).off( "resize", this.resizePlayer );
    };
    
    newHome.prototype.activate = function() {
	var self = this;
        self.videos.removeAll();
        
        // get months and create labels to use as selectors
        self.getAllDatesLabels();
        
        // get faces and create labels to use as filters
        self.getAllFacesLabels().then( function() {
            // If a face uuid is passed in via the url then filter to that face
            if( self.goToFace() ){
                if( self.findMatch( self.faceToGoTo(), self.facesLabels() ) != 'Error' ) {
                    self.faceSelected( self, self.findMatch( self.faceToGoTo(), self.facesLabels() ) );
                    //this strips the fid params off of the url after navigation
                    router.navigate('#home', { trigger: false, replace: true });                  
                } else {
                    router.navigate('#home');
                }               
            }
        });
        
        // get cities and create labels to use as filters
        self.getAllCityLabels();
        
        // get albums and create list
        self.getAllAlbumsLabels().then( function() {
            if( self.addAlbum() ){
                self.showAllVideos();
                $('.navbar-right').children('.albumsList').children('.dropdown-toggle').trigger('click');
                router.navigate('#home', { trigger: false, replace: true }); 
            }
        });
        
        if( self.showRecent() ){
            self.getRecentVids( true );
            router.navigate('#home', { trigger: false, replace: true }); 
        }
        
        self.getVidsInProcess();
    };
    
    newHome.prototype.resizePlayer = function() {
        var self = this;
        
	var player_height = ($("#player").width()*9) / 16;
        var title = $('.fancybox-title').height();
	$("#player, #player video, #player > div, .fancybox-outer").height( player_height ).css( 'max-height', head.screen.innerHeight-(200+title) );
        $('.fancybox-nav').height( $("#player").height()-30 );
    };
    
    newHome.prototype.should_simulate = function() {
	var videoel = document.createElement("video"),
	idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
	noflash = flashembed.getVersion()[0] === 0,
	simulate = !idevice && noflash && !!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
	return simulate;
    };
    
    newHome.prototype.setUpFlowplayer = function( elem, mf ) {
        var self = this;
        $(elem).flowplayer( { src: "lib/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' }, {
            ratio: 9/16,
            splash: true,
            clip: {
                url: 'mp4:' + mf.views.main.cf_url,
                ipadUrl: encodeURIComponent(mf.views.main.url),
                scaling: 'fit',
                provider: 'rtmp',
                onStart: function( clip ) {
                    viblio.mpEvent( 'play', { action: 'play' } );
                    viblio.mpPeopleIncrement('Video Plays from Browser', 1);
                    //hidePlayerOverlay();
                },
                onPause: function( clip ) {
                    viblio.mpEvent( 'play', { action: 'pause' } );
                },
                onResume: function( clip ) {
                    viblio.mpEvent( 'play', { action: 'resume' } );
                },
                onStop: function( clip ) {              
                    viblio.mpEvent( 'play', { action: 'stop' } );
                },
                onFinish: function( clip ) {
                    viblio.mpEvent( 'play', { action: 'finish' } );
                }
            },
            plugins: {
                // Cloudfront
                rtmp: {
                    url: 'lib/flowplayer/flowplayer.rtmp-3.2.12.swf',
                    netConnectionUrl: 'rtmp://' + config.cf_domain() + '/cfx/st'
                }
            },
            canvas: {
                backgroundColor:'#254558',
                backgroundGradient: [0.1, 0]
            }
        }).flowplayer().ipad({simulateiDevice: self.should_simulate()});
    };
    
    // In attached, attach the mCustomScrollbar we're presently
    // employing for this purpose.
    newHome.prototype.compositionComplete = function( view ) {
	var self = this;
	self.element = view;
        
        // At this point (and only at this point!) we have an accurate
	// height dimension for the scroll area and its item container.
        if( self.activateWithRegSearch() ){
            self.showAllVideos();
        }
        // set toolbarHeight
        self.toolbarHeight( self.select_mode_on() ? $('.select-nav').height() : $('.vids-nav').height() );      
        // set margin above title so it's not burried by toolbar
        setTimeout(function(){
            self.setTitleMargin();
        }, 300);
        
        $('.fancybox').fancybox({
            arrows: true,
            prevEffect: 'none',
            nextEffect: 'none',
            helpers: {
                title: {
                    type: 'inside',
                    position: 'top'
                },
                buttons	: {}
            },
            tpl: {
              // wrap template with custom inner DIV: the empty player container
              wrap: '<div class="fancybox-wrap" tabIndex="-1">' +
                    '<div class="fancybox-skin">' +
                    '<div class="fancybox-outer"><div class="fancyboxVidLoader centered"><div class="fancyboxVidLoader-Inner"><i class="fa fa-spinner fa-spin fa-5x active"></i><p class="font18">Loading...</p></div></div>' +
                    '<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>' +
                    '<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>' +
                    '<div id="player">' + // player container replaces fancybox-inner
                    '</div></div></div></div>' 
            },
            
            onNext: function() {
                if( self.playingVidIndex()+1 < self.videos().length ) {
                    self.playingVidIndex( self.playingVidIndex()+1 );
                    self.playingVid( self.videos()[self.playingVidIndex()] );
                    self.playingVidUUID( self.videos()[self.playingVidIndex()].media().uuid );
                }
            },
            
            onPrev: function() {
                if( self.playingVidIndex()-1 >= 0 ) {
                    self.playingVidIndex( self.playingVidIndex()-1 );
                    self.playingVid( self.videos()[self.playingVidIndex()] );
                    self.playingVidUUID( self.videos()[self.playingVidIndex()].media().uuid );
                }
            },
            
            beforeShow: function () {
                //console.log( self.playingVid().media() );
                if( head.mobile ) {
                    this.helpers.buttons = {position: 'bottom'};
                }
                var F = $.fancybox;
                var el;
                var href;
                var api;
                if( self.mfOwnedByViewer( self.playingVid() ) ) {
                    api = '/services/mediafile/get';
                    href = "new_player?mid=";
                } else {
                    api = '/services/na/media_shared';
                    href= "web_player?mid=";
                }
                el = " &mdash; <a class='vidDetails' href='#" + href + self.playingVidUUID() + "'onclick='$.fancybox.close()'> Details</a>";
                // if the vid is shared
                if( !self.mfOwnedByViewer( self.playingVid() ) ) {
                    el += "<div class='popupPlayerOwner-Wrap pull-right'><span>" + self.playingVid().owner_name() + "</span> <img class='img-circle' src='" + self.playingVid().owner_avatar + "'/></div>";
                }
                if( self.playingVid().media().eyes > 0 ) {
                    el += "<br/><span>" + self.playingVid().media().eyes + " Fan Views</span>";
                }
                
                this.title = "<span>"+self.playingVid().title()+"</span>"+el;
                
                var arr = [];
                self.videos().forEach( function(vid){
                    if( vid != self.playingVid() ) {
                        arr.push( vid.media().uuid );
                    }
                });
                PlayerPage.relatedVids( arr );
                
                $('.fancyboxVidLoader').show();
                return viblio.api( api, { mid: self.playingVidUUID()  } ).then( function( json ) {
                    var mf = json.media;
                    self.setUpFlowplayer( '#player', mf );
                    self.resizePlayer();
                    $('.fancyboxVidLoader').hide();
                });
            },
            
            afterLoad: function(current, previous) {
                // Needed to fire the correct functions when the nav buttons are clicked (prev and next)
                var F = $.fancybox;
                $('.fancybox-prev span').on('click', function() {
                    F.prev();
                });
                $('.fancybox-next span').on('click', function() {
                    F.next();
                });
                
                $('.fancybox-outer').height( ($("#player").width()*9) / 16 );
            },
            
            beforeClose: function () {
              // important! unload the player
              if(flowplayer()){
                  flowplayer().unload();
              }
            }
        });
        
        // photo viewer
        $('.photoGallery').magnificPopup({
            delegate: '.photo:not(".hidden") .pointer a', // child items selector, by clicking on it popup will open - by including .photo:not(".hidden") only visible photos will be included in the gallery 
            type: 'image',
            gallery: {enabled:true}
        });
    };

    newHome.prototype.add_videos = function() {
	dialog.showModal( 'viewmodels/nginx-modal' );
    };
    
    newHome.prototype.add_videos_to_empty_album = function() {
        var self = this;
        var args = {
            album: self.currentAlbum() 
        };
	dialog.showModal( 'viewmodels/nginx-modal', args );
    };
    
    // Animation callbacks
    this.showElement = function(elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn('slow'); };
    this.hideElement = function(elem) { if (elem.nodeType === 1) $(elem).fadeOut(function() { $(elem).remove(); }); };

    return newHome;

});
