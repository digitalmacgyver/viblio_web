define( ['plugins/router','lib/viblio','viewmodels/mediafile', 'durandal/app', 'durandal/events', 'durandal/system', 'lib/customDialogs'], function( router,viblio, Mediafile, app, events, system, dialog ) {

    var newHome = function() {
	var self = this;
        
        self.recentUploadsIsActive = ko.observable(false);
        
        self.show_find_options = ko.observable(false);
        self.select_mode_on = ko.observable(false);
        self.share_mode_on = ko.observable(false);
        self.add_to_mode_on = ko.observable(false);
        self.delete_mode_on = ko.observable(false);
        
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
        self.albumFilterIsActive = ko.observable(false);
        self.albumIsShared = ko.observable(null);
        self.currentAlbumAid = ko.observable(null);
        
        self.noFiltersAreActive = ko.computed( function() {
            if( self.recentUploadsIsActive() || self.dateFilterIsActive() || self.faceFilterIsActive() || self.cityFilterIsActive() || self.albumFilterIsActive() ) {
                return false;
            } else {
                return true;
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
                
        self.allVidsIsSelected = ko.observable( false );
        
        self.isActiveFlag = ko.observable(false);
        
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
        
        // Search section
        self.searchFilterIsActive = ko.observable(false);
        self.searchQuery = ko.observable(null);
        self.currentSearch = null;
        
        events.includeIn( this );
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
        if( face.selected() ) {
            face.selected(false);
            self.showAllVideos();
        } else {
            self.facesLabels().forEach( function( f ) {
                f.selected( false );
            });
            face.selected( true );
            self.selectedFace( face );
            self.faceVidsSearch( true );
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
        console.log( album );
        if( album.selected() ) {
            album.selected(false);
            self.currentAlbumAid(null);
            self.showAllVideos();
        } else {
            self.albumsFilterLabels().forEach( function( c ) {
                c.selected( false );
            });
            album.selected( true );
            self.selectedFilterAlbum( album.label );
            self.currentAlbumAid( album.uuid );
            self.albumVidsSearch( true );
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
    
    newHome.prototype.mfOwnedByViewer = function( mf ) {
        if( mf.owner_uuid == viblio.user().uuid ){
            return true;
        } else {
            return false;
        }
    };
    
    newHome.prototype.addAlbumMediaFile = function( mf ) {
	var self = this;
        
	// Create a new Mediafile with the data from the server - Only albums owned by the viewer will be given the share badge

	var m = new Mediafile( mf, self.mfOwnedByViewer(mf) ? { show_share_badge: true, show_preview: true, delete_title: self.albumIsShared() ? 'unshare' : 'remove', show_faces_tags: true, ownedByViewer: true, show_select_badge: self.select_mode_on(), selected: self.select_mode_on() } : { show_preview: true, delete_title: 'remove', ro: true, show_faces_tags: true, shared_style: true, owner_uuid: mf.owner_uuid } );	

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
                if ( m.show_share_badge() ) {
                    vidsOwnedByViewerNum( vidsOwnedByViewerNum()-1 );
                }
            });
        });
        
        m.on( 'mediafile:selected', function( m ) {
            self.selectedVideos.push(m.media().uuid);              
        });

        m.on( 'mediafile:unselected', function( m ) {
            self.selectedVideos.remove(m.media().uuid);              
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
            var m = new Mediafile( mf, { ro: true, show_delete_mode: self.delete_mode_on(), shared_style: true, owner_uuid: mf.owner_uuid } ); //m.ro( true );
            m.on( 'mediafile:play', function( m ) {
                router.navigate( 'web_player?mid=' + m.media().uuid );
            });
            m.on( 'mediafile:delete', function( m ) {
                viblio.api( '/services/mediafile/delete_share', { mid: m.media().uuid } ).then( function( data ) {
                    viblio.mpEvent( 'delete_share' );
                    self.sections().forEach( function( section ) {
                        section.media.remove( m );
                    });
                });
            });    
        } else {
            // Owned by user
            var m = new Mediafile( mf, { show_share_badge: true, show_delete_mode: self.delete_mode_on(), show_select_badge: self.select_mode_on(), selected: self.select_mode_on() } );

            // Proxy the mediafile play event and send it along to
            // our parent.
            m.on( 'mediafile:play', function( m ) {
                router.navigate( 'new_player?mid=' + m.media().uuid );
            });

            m.on( 'mediafile:delete', function( m ) {
                viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function( json ) {
                    viblio.mpEvent( 'delete_video' );
                    self.videos.remove( m );
                    if ( json && json.contacts ) {
                        json.contacts.forEach( function( contact ) {
                            app.trigger( 'top-actor:remove', contact );
                        });
                    }
                });
            });
            
            m.on( 'mediafile:selected', function( m ) {
                self.selectedVideos.push(m.media().uuid);              
            });
            
            m.on( 'mediafile:unselected', function( m ) {
                self.selectedVideos.remove(m.media().uuid);              
            });
        }
        	         
	// Add it to the list
	self.videos.push( m );
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
    newHome.prototype.activate_select_mode = function() {
	var self = this;
        
        self.select_mode_on(true);
        
        self.videos().forEach( function( mf ) {
            if( self.mfOwnedByViewer(mf) ) {
                mf.turnOnSelectMode();
            }
        });
    };
    
    newHome.prototype.deactivate_select_mode = function() {
	var self = this;
        
        self.select_mode_on(false);
        
        self.videos().forEach( function( mf ) {
            if( self.mfOwnedByViewer(mf) ) {
                mf.turnOffSelectMode();
            }
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
        
        self.activate_select_mode();
        self.clear_all_modes();
        self.share_mode_on(true);
    };
    
    newHome.prototype.add_to_mode = function() {
        var self = this;
        
        self.activate_select_mode();
        self.clear_all_modes();
        self.add_to_mode_on(true);
    };
    
    newHome.prototype.delete_mode = function() {
        var self = this;
        
        self.activate_select_mode();
        self.clear_all_modes();
        self.delete_mode_on(true);
    };
    
    newHome.prototype.done_with_select_mode = function() {
        var self = this;
        
        self.select_mode_on(false);
        self.deactivate_select_mode();
    };
    
    newHome.prototype.cancel_select_mode = function() {
        var self = this;
        
        // turn off select mode - hides select toolbar
        self.select_mode_on(false);
        // set all modes to false
        self.clear_all_modes();
        // hide select boxes from vids
        self.deactivate_select_mode();
        // make sure all vids are unselected
        self.videos().forEach( function( mf ) {
            mf.selected( false );
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
        var self = this;
        var args = {};
        args = {
            cid: self.cid
        };
        self.facesLabels.removeAll();
        viblio.api( '/services/faces/contacts', args ).then( function(data) {
            data.faces.forEach( function( face ) {
                var _face = face;
                _face.label = face.contact_name;
                _face.selected = ko.observable( false );
                
                self.facesLabels.push( _face );
            });
        });
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
            
            //also set the album filter labels
            var clone = arr.slice(0);
            self.albumsFilterLabels( clone );
            
            self.albumLabels.unshift( {label: "Create New Album", selected: ko.observable(false)} );
        });
    };
    
    newHome.prototype.selectAll = function() {
        var self = this;
        
        self.videos().forEach( function(video) {
            video.selected(true);
        });
    }
    
    newHome.prototype.unselectAll = function() {
        var self = this;
        
        self.videos().forEach( function(video) {
            video.selected(false);
        });
    }
    
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
            return self.searchQuery();
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
    
    newHome.prototype.addOrCreateAlbum = function() {
        var self = this;
        
        if ( self.selectedVideos().length > 0 ) {
            // Create a new album
            if( self.selectedAddToAlbum().label === 'Create New Album' ) {          
                viblio.api( '/services/album/create', { name: self.getAlbumName(), list: self.selectedVideos() } ).then( function( data ) {
                    router.navigate( 'viewAlbum?aid=' + data.album.uuid );
                });
            } else {
                // Add to an existing album
                viblio.api( '/services/album/create', { aid: self.selectedAddToAlbum().uuid, list: self.selectedVideos() } ).then( function( data ) {
                    var vidOrVids = self.selectedVideos().length == 1 ? ' video' : ' videos';
                    var msg = self.selectedVideos().length + vidOrVids + ' successfully added to your "' + self.selectedAddToAlbum().label + '" Album';
                    viblio.notify( msg, 'success' );
                });        
                // Used to close the dropdown
                $("body").trigger("click");
                // unselect albums
                self.albumLabels().forEach( function( a ) {
                    a.selected( false );
                });
            }    
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
                    apiCall = viblio.api( '/services/mediafile/list', 
			    { 
				views: ['poster'],
				page: self.allVidsPager.next_page, 
				rows: self.allVidsPager.entries_per_page } );
                }
		apiCall.then( function( json ) {
                        self.hits ( json.pager.total_entries );
			self.allVidsPager = json.pager;
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
                    self.search();
                } 
            }
        }
    };

    newHome.prototype.attached = function() {
	$(window).scroll( this, this.scrollHandler );
    };

    newHome.prototype.detached = function() {
	$(window).off( "scroll", this.scollHandler );
    };
    
    newHome.prototype.activate = function() {
	var self = this;
	var args = {};
        args = {
            cid: self.cid
        };

        // get months and create labels to use as selectors
        self.getAllDatesLabels();
        
        // get faces and create labels to use as filters
        self.getAllFacesLabels();
        
        // get cities and create labels to use as filters
        self.getAllCityLabels();
        
        // get albums and create list
        self.getAllAlbumsLabels();
    };   

    // In attached, attach the mCustomScrollbar we're presently
    // employing for this purpose.
    newHome.prototype.compositionComplete = function( view ) {
	var self = this;
	self.element = view;
        
        // At this point (and only at this point!) we have an accurate
	// height dimension for the scroll area and its item container.
	self.search();
    };

    newHome.prototype.add_videos = function() {
	dialog.showModal( 'viewmodels/nginx-modal' );
    };
    
    // Animation callbacks
    this.showElement = function(elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn('slow'); };
    this.hideElement = function(elem) { if (elem.nodeType === 1) $(elem).fadeOut(function() { $(elem).remove(); }); };

    return newHome;

});
