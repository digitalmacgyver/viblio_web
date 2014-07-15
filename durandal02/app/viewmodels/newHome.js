define( ['plugins/router','lib/viblio','viewmodels/mediafile', 'durandal/app', 'durandal/events', 'durandal/system', 'lib/customDialogs'], function( router,viblio, Mediafile, app, events, system, dialog ) {

    var newHome = function( args ) {
	var self = this;
        
        // Go to a specific album - aid provided via link from an email
        self.goToAlbum = ko.computed( function() {
            if( args ) {
                if( args.aid ) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
        self.albumToGoTo = ko.computed(function(){
            if( args ) {
                if( args.aid ) {
                    return args.aid;
                } else {
                    return null;
                }
            } else {
                return null
            }
        });
        
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
        self.share_mode_on = ko.observable(false);
        self.add_to_mode_on = ko.observable(false);
        self.delete_mode_on = ko.observable(false);
        
        self.toolbarHeight = ko.observable( self.select_mode_on() ? $('.select-nav').height() : $('.vids-nav').height() );
        
        self.datesLabels  = ko.observableArray([]);
        self.showingAllDatesLabels = ko.observable(true);
        self.selectedMonth = ko.observable();
        self.dateFilterIsActive = ko.observable(false);
        
        self.facesLabels = ko.observableArray([]);
        self.selectedFace = ko.observable();
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
        self.currentAlbum = ko.observable(null);
        self.albumIsShared = ko.observable(null);
        self.currentAlbumAid = ko.observable(null);
        self.currentAlbumTitle = ko.observable(null);
        
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
        
        self.selectedVideos = ko.observableArray();
        
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
        
        self.isActiveFlag = ko.observable(true);
        
        // Hold the pager data back from server
	// media queries.  Initialize it here so
	// the first fetch works.
	self.allVidsPager = {
	    next_page: 1,
	    entries_per_page: 20,
	    total_entries: -1 /* currently unknown */
	};
        
        self.recentPager = {
            next_page: 1,
            entries_per_page: 20,
            total_entries: -1 /* currently unknown */
        };
        
        self.monthPager = {
	    next_page: 1,
	    entries_per_page: 20,
	    total_entries: -1 /* currently unknown */
	};
        
        self.facesPager = {
	    next_page: 1,
	    entries_per_page: 20,
	    total_entries: -1 /* currently unknown */
	};
        
        self.citiesPager = {
	    next_page: 1,
	    entries_per_page: 20,
	    total_entries: -1 /* currently unknown */
	};
        
        self.searchPager = {};
        
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
        
        events.includeIn( this );
        
        app.on('fscroll:seeAll', function( face ){
            self.faceSelected( self, self.findMatch( face.uuid, self.facesLabels() ) );
        });
    };
    
    newHome.prototype.toggleRecentVids = function() {
        var self = this;
        
        if( self.recentUploadsIsActive() ) {
            self.recentUploadsIsActive( false );
            self.showAllVideos();
        } else {
            self.recentVidsSearch( true );
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
    
    newHome.prototype.recentVidsSearch = function( newSearch ) {
        var self = this;
        
        var args = {
            //days: 30
        };
        
        self.isActiveFlag(true);
        
        // Only remove all vids and reset pager if it's a new search
        if( newSearch ) {
            self.clearfilters();
            self.videos.removeAll();
            // reset pager
            self.recentPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };
        }
        
        return system.defer( function( dfd ) {
            if ( self.recentPager.next_page )   {
                args.page = self.recentPager.next_page;
                args.rows = self.recentPager.entries_per_page;
                viblio.api( '/services/mediafile/recently_uploaded', args )
                    .then( function( json ) {
                        self.hits ( json.pager.total_entries );
                        self.recentPager = json.pager;
                        json.media.forEach( function( mf ) {
                            self.addMediaFile ( mf );
                        });
                        dfd.resolve();
                    });
            }
            else {
                dfd.resolve();
            }
        }).promise().then(function(){
            self.searchQuery(null);
            self.recentUploadsIsActive(true);
            
            self.isActiveFlag(false);
            
            // Used to close the dropdown
            $("body").trigger("click");
        });
    };
    
    newHome.prototype.monthSelected = function( self, month ) {
        if( month.selected() ) {
            month.selected(false);
            self.showAllVideos();
        } else {
            self.datesLabels().forEach( function( m ) {
                m.selected( false );
            });
            month.selected( true );
            self.selectedMonth( month.label );
            self.monthVidsSearch( true );
        }
    };
    
    newHome.prototype.monthVidsSearch = function( newSearch ) {
	var self = this;
        
        var month = self.selectedMonth();
        
        var args = {
            month: month,
            cid: self.cid
        };
        self.isActiveFlag(true);
        
        // Only remove all vids and reset pager if it's a new search
        if( newSearch ) {
            //clear the search contents
            self.clearSearch();
            self.unselectOtherFilters('dates');
            //self.videos.removeAll();
            // reset pager
            self.monthPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };    
        }
        
	return system.defer( function( dfd ) {
	    if ( self.monthPager.next_page )   {
                args.page = self.monthPager.next_page;
                args.rows = self.monthPager.entries_per_page;
		viblio.api( '/services/yir/videos_for_month', args )
		    .then( function( json ) {
                        self.hits ( json.pager.total_entries );
			self.monthPager = json.pager;
                        json.media.forEach( function( mf ) {
                            self.addMediaFile ( mf );
                        });
			dfd.resolve();
		    });
	    }
	    else {
		dfd.resolve();
	    }
	}).promise().then(function(){
            // reset active filters
            self.recentUploadsIsActive(false);
            self.dateFilterIsActive(true);
            self.faceFilterIsActive(false);
            self.selectedFace('');
            self.allVidsIsSelected(false);
            self.cityFilterIsActive(false);
            self.selectedCity('');
            self.albumFilterIsActive(false);
            self.selectedFilterAlbum('');
            
            self.isActiveFlag(false);
            
            // Used to close the dropdown
            $("body").trigger("click");
        });
    };
    
    newHome.prototype.faceSelected = function( self, face ) {
        console.log( 'faceSelected fired', face );
        
        var gettingFace;
        
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
                self.faceVidsSearch( true );
                gettingFace = false;
            }
        } else {
            return;
        }    
    };
    
    newHome.prototype.faceVidsSearch = function( newSearch ) {
        var self = this;
        
        var face = self.selectedFace();
        
        var args = {
            contact_uuid: face.uuid
        };
        
        self.isActiveFlag(true);
        
        // Only remove all vids and reset pager if it's a new search
        if( newSearch ) {
            //clear the search contents
            self.clearSearch();
            self.unselectOtherFilters('faces');
            //self.videos.removeAll();
            // reset pager
            self.facesPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };
        }
        
        return system.defer( function( dfd ) {
            if ( self.facesPager.next_page )   {
                args.page = self.facesPager.next_page;
                args.rows = self.facesPager.entries_per_page;
                viblio.api( '/services/faces/media_face_appears_in', args )
                    .then( function( json ) {
                        self.hits ( json.pager.total_entries );
                        self.facesPager = json.pager;
                        json.media.forEach( function( mf ) {
                            self.addMediaFile ( mf );
                        });
                        dfd.resolve();
                    });
            }
            else {
                dfd.resolve();
            }
        }).promise().then(function(){
            // reset active filters
            self.recentUploadsIsActive(false);
            self.dateFilterIsActive(false);
            self.selectedMonth('');
            self.faceFilterIsActive(true);
            self.allVidsIsSelected(false);
            self.cityFilterIsActive(false);
            self.selectedCity('');
            self.albumFilterIsActive(false);
            self.selectedFilterAlbum('');
            
            self.isActiveFlag(false);
            
            // Used to close the dropdown
            $("body").trigger("click");
        });
    };
    
    newHome.prototype.citySelected = function( self, city ) {
        if( city.selected() ) {
            city.selected(false);
            self.showAllVideos();
        } else {
            self.citiesLabels().forEach( function( c ) {
                c.selected( false );
            });
            city.selected( true );
            self.selectedCity( city.label );
            self.cityVidsSearch( true );
        }         
    };
    
    newHome.prototype.cityVidsSearch = function( newSearch ) {
        var self = this;
        
        var city = self.selectedCity();
        
        var args = {
            q: city
        };
        
        self.isActiveFlag(true);
        
        // Only remove all vids and reset pager if it's a new search
        if( newSearch ) {
            //clear the search contents
            self.clearSearch();
            self.unselectOtherFilters('cities');
            //self.videos.removeAll();
            // reset pager
            self.cityPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };
        }
        
        return system.defer( function( dfd ) {
            if ( self.cityPager.next_page )   {
                args.page = self.cityPager.next_page;
                args.rows = self.cityPager.entries_per_page;
                viblio.api( '/services/mediafile/taken_in_city', args )
                    .then( function( json ) {
                        self.hits ( json.pager.total_entries );
                        self.cityPager = json.pager;
                        json.media.forEach( function( mf ) {
                            self.addMediaFile ( mf );
                        });
                        dfd.resolve();
                    });
            }
            else {
                dfd.resolve();
            }
        }).promise().then(function(){
            // reset active filters
            self.recentUploadsIsActive(false);
            self.dateFilterIsActive(false);
            self.selectedMonth('');
            self.faceFilterIsActive(false);
            self.selectedFace('');
            self.allVidsIsSelected(false);
            self.cityFilterIsActive(true);
            self.albumFilterIsActive(false);
            self.selectedFilterAlbum('');
            
            self.isActiveFlag(false);
            
            // Used to close the dropdown
            $("body").trigger("click");
        });
    };
    
    newHome.prototype.albumFilterSelected = function( self, album ) {
        console.log( 'albumFilterSelected', album );
        var gettingAlbum;
        
        if( !gettingAlbum ) {
            gettingAlbum = true;
            if( album.selected() ) {
                album.selected(false);
                self.currentAlbumAid(null);
                self.currentAlbumTitle(null);
                self.showAllVideos();
                gettingAlbum = false;
            } else {
                self.albumsFilterLabels().forEach( function( c ) {
                    c.selected( false );
                });
                album.selected( true );
                self.selectedFilterAlbum( album.label );
                self.currentSelectedFilterAlbum( album );
                self.currentAlbumAid( album.uuid );
                self.currentAlbumTitle( album.title );
                self.albumVidsSearch( true );
                gettingAlbum = false;
            }
        } else {
            return;
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
            //self.videos.removeAll();
            // reset pager
            /*self.albumsPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            //};
        }
        
        return system.defer( function( dfd ) {
            /*if ( self.albumsPager.next_page )   {
                args.page = self.facesPager.next_page;
                args.rows = self.facesPager.entries_per_page;*/
                viblio.api( 'services/album/get?aid=' + album_id + '&include_contact_info=1&include_tags=1').
                    then( function( json ) {
                        //self.hits ( json.pager.total_entries );
                        //self.facesPager = json.pager;
                        self.currentAlbum( json.album );
                        self.albumIsShared( json.album.is_shared ? true : false );
                        json.album.media.forEach( function( mf ) {
                            self.addAlbumMediaFile ( mf );
                        });
                        dfd.resolve();
                    });
            /*}
            else {
                dfd.resolve();
            }*/
        }).promise().then(function(){
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
            
            self.isActiveFlag(false);
            
            // Used to close the dropdown
            $("body").trigger("click");
        });
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
    
    newHome.prototype.showMessage = function( type ) {
        var self = this;
        var msg;
        var showMessage = false;
        
        if( type === 'albums') {
            if( self.albumsFilterLabels().length === 0 ) {
                showMessage = true;
            }
            msg = "<p>You haven’t created any albums yet. Go back to your Library <img src='/css/images/messages/library.png'> and then click the Add To <img src='/css/images/messages/addTo.png'> button to start your first Album.</p>";
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

	var m = new Mediafile( mf, self.mfOwnedByViewer(mf) ? { show_share_badge: !self.select_mode_on(), show_preview: true, show_faces_tags: true, ownedByViewer: true, show_select_badge: self.select_mode_on(), selected: self.select_all_mode_is_on() } : { show_preview: true, ro: true, show_faces_tags: true, shared_style: true, owner_uuid: mf.owner_uuid, show_select_badge: self.select_mode_on(), selected: self.select_all_mode_is_on() } );	

	// Play a mediafile clip.  This uses the query parameter
	// passing technique to pass in the mediafile to play.
	m.on( 'mediafile:play', function( m ) {
	    if ( m.media().owner_uuid == viblio.user().uuid )
		router.navigate( 'new_player?mid=' + m.media().uuid );
	    else
		router.navigate( 'web_player?mid=' + m.media().uuid );
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

	// Add it to the list
	self.videos.push( m );
    };
    
    // Add a new mediafile to our managed list of mediafiles
    newHome.prototype.addMediaFile = function( mf ) {
	var self = this;
        
        if( mf.is_shared == 1 ) {
            // Shared with user
            var m = new Mediafile( mf, { ro: true, shared_style: true, owner_uuid: mf.owner_uuid, show_select_badge: self.delete_mode_on() ? self.select_mode_on() : false, selected: self.delete_mode_on() ? self.select_all_mode_is_on() : false } ); //m.ro( true );
            m.on( 'mediafile:play', function( m ) {
                router.navigate( 'web_player?mid=' + m.media().uuid );
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
            var m = new Mediafile( mf, { show_share_badge: !self.select_mode_on(), show_select_badge: self.select_mode_on(), selected: self.select_all_mode_is_on() } );

            // Proxy the mediafile play event and send it along to
            // our parent.
            m.on( 'mediafile:play', function( m ) {
                router.navigate( 'new_player?mid=' + m.media().uuid );
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
        
	// Add it to the list
	self.videos.push( m );
        
        // If select all mode is on when new vids are added then add them to the selected array too - only if owned by viewer
        if( self.select_all_mode_is_on() && self.select_mode_on() ) {
            if( self.delete_mode_on() ){
                self.selectedVideos.push( m );
            } else {
                if( self.mfOwnedByViewer( m ) ) {
                    self.selectedVideos.push( m );
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
    };
    
    newHome.prototype.deactivate_select_mode = function() {
	var self = this;
        
        self.select_mode_on(false);
        // set margin above title so it's not burried by toolbar
        setTimeout(function(){
            self.setTitleMargin();
        }, 300);
        
        self.videos().forEach( function( mf ) {
            mf.turnOffSelectMode();
        });
    };
    
    newHome.prototype.clear_all_modes = function() {
        var self = this;
        
        self.share_mode_on(false);
        self.add_to_mode_on(false);
        self.delete_mode_on(false);
    };
    
    newHome.prototype.share_mode = function() {
        var self = this;
        
        //self.activate_select_mode();
        self.clear_all_modes();
        self.share_mode_on(true);
        dialog.showShareAlbumModal( self.currentSelectedFilterAlbum() );
    };
    
    newHome.prototype.add_to_mode = function() {
        var self = this;
        
        self.activate_select_mode();
        self.selectAll();
        self.clear_all_modes();
        self.add_to_mode_on(true);
    };
    
    newHome.prototype.delete_mode = function() {
        var self = this;
        
        // If an album is selected AND it's not owned by the user then only select user's vids
        if( self.albumFilterIsActive() && self.currentSelectedFilterAlbum().shared == 1 ) {
            self.activate_select_mode();
        } 
        // else select ALL vids - those owned by the user and shared with the user
        else {
            self.activate_select_mode(true);
        }    
        self.clear_all_modes();
        self.delete_mode_on(true);
    };
    
    newHome.prototype.delete_album = function( dfd ) {
        var self = this;
        
        var message
        
        if( self.currentSelectedFilterAlbum().shared == 0 ) {
            // owned by viewer - delete
            message = 'If you delete this album, individual videos are not deleted, but no one you <br />shared this album with will be able to see this collection anymore. <br /> Do you want to continue?';
            app.showMessage( message, 'Delete Confirmation', ['Yes', 'No']).then( function( data ) {
                if( data == 'Yes' ) {
                    viblio.api( '/services/album/delete_album', { aid: self.currentSelectedFilterAlbum().uuid } ).then( function() {
                        viblio.mpEvent( 'delete_album' );
                        self.albumsFilterLabels.remove( self.currentSelectedFilterAlbum() );
                        self.albumLabels.remove( self.currentSelectedFilterAlbum() );
                        self.showAllVideos();
                    });    
                } else {
                    return;
                }                   
            });
        } else {
            // owned by another viblio user - remove share
            message = 'If you remove this album, you will no longer be subscribed<br /> to any content the album owner adds to it. <br /> Do you want to continue?';
            app.showMessage( message, 'Delete Confirmation', ['Yes', 'No']).then( function( data ) {
                if( data == 'Yes' ) {
                    viblio.api( '/services/album/remove_me_from_shared', { aid: self.currentSelectedFilterAlbum().uuid } ).then( function() {
                        viblio.mpEvent( 'delete_album' );
                        self.albumsFilterLabels.remove( self.currentSelectedFilterAlbum() );
                        self.albumLabels.remove( self.currentSelectedFilterAlbum() );
                        self.showAllVideos();
                    });    
                } else {
                    return;
                }                 
            });
        }
    };
    
    newHome.prototype.handle_delete = function( dfd ) {
        var self = this;
        
        var len = self.selectedVideos().length;
        var albumOrAccount = self.albumFilterIsActive() ? 'this album' : 'your account'
        var message = 'Are you sure you want to remove ' + len + ( len == 1 ? ' video' : ' videos' ) + ' from ' + albumOrAccount + '?';
        
        if( len > 0 ) {
            app.showMessage( message, 'Delete Confirmation', ['Yes', 'No']).then( function( data ) {
                if( data == 'Yes' ){
                    self.videos().forEach( function( mf ) {
                        if( mf.selected() ) {
                            mf.mfdelete();
                        }
                    });
                    dfd.resolve();
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
            return system.defer( function( dfd ) {
                self.addOrCreateAlbum( dfd );
            }).promise().done( function() {
                self.getAllAlbumsLabels();
                self.clean_up_after_select_mode();    
            }).fail( function() {
                self.cancel_select_mode();
            });
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
        // unselect the currently selected "add to" album
        self.selectedAddToAlbumLabel( null );
        self.selectedAddToAlbum( null );
        self.albumLabels().forEach( function( a ) {
            a.selected( false );
        });
        // clear selected vids array
        self.selectedVideos.removeAll(); 
    };
    
    newHome.prototype.resetSearchPager = function() {
        var self = this;
        
        self.searchPager = {
            next_page: 1,
            entries_per_page: 20,
            total_entries: -1 /* currently unknown */
        };
    };
    
    newHome.prototype.newVidsSearch = function( newSearch ) {
        var self = this;
        
        if ( !self.searchQuery() ) {
            return;
        } else {
            if( newSearch ) {
                self.clearfilters();
                self.unselectOtherFilters(null);
            }           
            self.searchFilterIsActive(true);
            self.videos.removeAll();
            self.resetSearchPager();
            self.currentSearch = self.searchQuery();
            self.vidsSearch();
        }
    };
    
    newHome.prototype.vidsSearch = function() {
        var self = this;
        
        var args = {
            q: self.currentSearch
        };
        self.isActiveFlag(true);
        return system.defer( function( dfd ) {
            if ( self.searchPager.next_page )   {
                args.page = self.searchPager.next_page;
                args.rows = self.searchPager.entries_per_page;
                viblio.api( '/services/mediafile/search_by_title_or_description', args )
                    .then( function( json ) {
                        self.hits ( json.pager.total_entries );
                        self.searchPager = json.pager;
                        json.media.forEach( function( mf ) {
                            self.addMediaFile ( mf );
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
        
    };
    
    newHome.prototype.clearSearch = function( andFilter ) {
        var self = this;
        
        self.searchFilterIsActive( false );
        self.searchQuery(null);
        self.videos.removeAll();
        
        if( andFilter ) {
            self.clearfilters();
        }
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
        console.log( 'getAllFacesLabels fired' );
        var self = this;
        var args = {};
        args = {
            cid: self.cid
        };
        self.facesLabels.removeAll();
        var gettingFaceLabels = false;
        
        if( gettingFaceLabels === false ) {
            console.log( 'gettingFaceLabels: ', gettingFaceLabels );
            gettingFaceLabels = true;
            console.log( 'gettingFaceLabels: ', gettingFaceLabels );
            
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
        self.albumsFilterLabels.removeAll();
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

                //also set the album filter labels based on the same data returned by api call
                //JSON.parse(JSON.stringify(arr));
                var clone = JSON.parse(JSON.stringify(data));
                var arr2 = [];

                clone.albums.forEach( function( album ) {
                    var _album = album;
                    _album.label = album.title;
                    _album.selected = ko.observable( false );
                    _album.shared = album.is_shared;
                    arr2.push( _album );
                });

                //alphabetically sort the list - toLowerCase() makes sure this works as expected
                arr2.sort(function(left, right) { return left.label.toLowerCase() == right.label.toLowerCase() ? 0 : (left.label.toLowerCase() < right.label.toLowerCase() ? -1 : 1) });           
                self.albumsFilterLabels( arr2 );
                dfd.resolve();
            });    
        }).promise();
    };
    
    newHome.prototype.selectAll = function() {
        var self = this;
        
        self.select_all_mode_is_on( true );
        if( self.delete_mode_on() ) {
            self.videos().forEach( function(video) {
                video.select();
            });
        } else {
            self.videos().forEach( function(video) {
                if( self.mfOwnedByViewer(video) ) {
                    video.select();
                }
            });
        }
    };
    
    newHome.prototype.unselectAll = function() {
        var self = this;
        
        self.select_all_mode_is_on( false );
        self.videos().forEach( function(video) {
            video.unselect();
        });
        self.selectedVideos.removeAll();
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
    
    newHome.prototype.addToAlbumSelected = function( self, album ) {
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
        if ( self.selectedVideos().length > 0 ) {
            // Create a new album
            if( self.selectedAddToAlbum().label === 'Create New Album' ) {          
                viblio.api( '/services/album/create', { name: self.getAlbumName(), list: self.selectedVideos() } ).then( function( data ) {
                    var vidOrVids = num == 1 ? ' video' : ' videos';
                    var msg = num + vidOrVids + ' successfully added to your new "' + self.getAlbumName() + '" Album';
                    viblio.notify( msg, 'success' );
                    self.getAllAlbumsLabels().then( function() {
                        self.albumFilterSelected( self, self.findMatch( data.album.uuid, self.albumsFilterLabels() ) );  
                    });
                    dfd.resolve();
                });
            } else {
                // Add to an existing album
                viblio.api( '/services/album/add_media', { aid: self.selectedAddToAlbum().uuid, list: self.selectedVideos() } ).then( function( data ) {
                    var vidOrVids = num == 1 ? ' video' : ' videos';
                    var msg = num + vidOrVids + ' successfully added to your "' + self.selectedAddToAlbum().label + '" Album';
                    viblio.notify( msg, 'success' );
                    self.albumFilterSelected( self, self.findMatch( data.album.uuid, self.albumsFilterLabels() ) );  
                    dfd.resolve();
                });        
                // Used to close the dropdown
                $("body").trigger("click");
                // unselect albums
                self.albumLabels().forEach( function( a ) {
                    a.selected( false );
                });
            }    
        } else {
            dfd.reject();
        }
    };
    
    newHome.prototype.search = function() {
	var self = this;
        var apiCall;
        var args = {};
        self.isActiveFlag(true);
	return system.defer( function( dfd ) {
	    if ( self.allVidsPager.next_page )   {
                if( self.cid ) {
                    args = {contact_uuid: self.cid,
                            page: self.allVidsPager.next_page, 
                            rows: self.allVidsPager.entries_per_page};
                    apiCall = viblio.api( '/services/faces/media_face_appears_in', args );
                } else {
                    apiCall = viblio.api( '/services/mediafile/list_all', 
			    { 
				views: ['poster'],
				page: self.allVidsPager.next_page, 
				rows: self.allVidsPager.entries_per_page } );
                }
		apiCall.then( function( json ) {
                        self.hits ( json.pager.total_entries );
			self.allVidsPager = json.pager;
                        if(json.albums){
                            json.media = json.albums;
                        }
			json.media.forEach( function( mf ) {
			    self.addMediaFile( mf, {show_select_badge: true, selected: false} );
			});
			dfd.resolve();
		    });
	    }
	    else {
		dfd.resolve();
	    }
	}).promise().then(function(){
            self.isActiveFlag(false);
            setTimeout(function(){
                self.setTitleMargin();
            }, 300);
        });
    };
    
    newHome.prototype.showAllVideos = function() {
        var self = this;
        $("body").trigger("click");
        self.searchFilterIsActive( false );
        self.searchQuery(null);
        self.unselectOtherFilters();
        self.clearfilters();
        self.allVidsIsSelected(true);
        self.videos.removeAll();
        // reset pager
        self.allVidsPager = {
	    next_page: 1,
	    entries_per_page: 20,
	    total_entries: -1 /* currently unknown */
	};
        self.search();
    };

    // bind to scroll() event and when scroll is 150px or less from bottom fetch more data.
    // Uses flag to determine if fetch is already in process, if so a new one will not be made 
    newHome.prototype.scrollHandler = function( event ) {
        var self = event.data;

        if ( !self.noFiltersAreActive() ) {
            if( self.recentUploadsIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.recentVidsSearch();
                }
            } else if ( self.dateFilterIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.monthVidsSearch();
                }
            } else if( self.faceFilterIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.faceVidsSearch();
                }
            } else if( self.cityFilterIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.cityVidsSearch();
                }
            }    
        } else {
            if( self.searchFilterIsActive() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.vidsSearch();
                }    
            } else {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    console.log('firing self.search from scrollHandler');
                    self.search();
                } 
            }
        }
    };
    
    newHome.prototype.setTitleMargin = function() {
        var self = this;
        self.toolbarHeight( self.select_mode_on() ? $('.select-nav').height() : $('.vids-nav').height() );
        var marginTop = self.toolbarHeight() > 43 ? 100 + (self.toolbarHeight() - 43) : 100;
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
    };

    newHome.prototype.detached = function() {
	$(window).off( "scroll", this.scollHandler );
        $(window).off( "scroll", this.stickyDates );
        $(window).off( "scroll", this.stickyToolbars );
        $(window).off( "resize", this.getWindowWidth );
        $(window).off( "resize", this.stickyDates );
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
                console.log( 'activate goToFace fired');
                if( self.findMatch( self.faceToGoTo(), self.facesLabels() ) != 'Error' ) {
                    self.faceSelected( self, self.findMatch( self.faceToGoTo(), self.facesLabels() ) );
                    //this strips the fid params off of the url after navigation
                    //router.navigate('#home', { trigger: false, replace: true });                  
                } else {
                    router.navigate('#home');
                }               
            }
        });
        
        // get cities and create labels to use as filters
        self.getAllCityLabels();
        
        // get albums and create list
        self.getAllAlbumsLabels().then( function() {
            // If an album uuid is passed in via the url then filter to that album
            if( self.goToAlbum() ){
                console.log( 'getAllAlbumsLabels fired, now going to if/else' );
                if( self.findMatch( self.albumToGoTo(), self.albumsFilterLabels() ) != 'Error' ) {                
                    self.albumFilterSelected( self, self.findMatch( self.albumToGoTo(), self.albumsFilterLabels() ) );
                    //this strips the aid params off of the url after navigation
                    //router.navigate('#home', { trigger: false, replace: true });                  
                } else {
                    router.navigate('#home');
                }               
            }
        });
    };
    
    // In attached, attach the mCustomScrollbar we're presently
    // employing for this purpose.
    newHome.prototype.compositionComplete = function( view ) {
	var self = this;
	self.element = view;
        
        // At this point (and only at this point!) we have an accurate
	// height dimension for the scroll area and its item container.
        if( self.activateWithRegSearch() ){
            console.log( 'showAllVideos is firing' );
            self.showAllVideos();
        }
        // set toolbarHeight
        self.toolbarHeight( self.select_mode_on() ? $('.select-nav').height() : $('.vids-nav').height() );      
        // set margin above title so it's not burried by toolbar
        setTimeout(function(){
            self.setTitleMargin();
        }, 300);
    };

    newHome.prototype.add_videos = function() {
	dialog.showModal( 'viewmodels/nginx-modal' );
    };
    
    // Animation callbacks
    this.showElement = function(elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn('slow'); };
    this.hideElement = function(elem) { if (elem.nodeType === 1) $(elem).fadeOut(function() { $(elem).remove(); }); };

    return newHome;

});
