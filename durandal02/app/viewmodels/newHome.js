define( ['plugins/router','lib/viblio','viewmodels/mediafile', 'durandal/app', 'durandal/events', 'durandal/system', 'lib/customDialogs'], function( router,viblio, Mediafile, app, events, system, dialog ) {

    var newHome = function() {
	var self = this;
        
        self.recentUploadsIsActive = ko.observable(false);
        
        self.show_find_options = ko.observable(false);
        
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
        
        self.noFiltersAreActive = ko.computed( function() {
            if( self.recentUploadsIsActive() || self.dateFilterIsActive() || self.faceFilterIsActive() || self.cityFilterIsActive() ) {
                return false;
            } else {
                return true;
            }
        });
        
        self.albumLabels = ko.observableArray();
        self.selectedAlbum = ko.observable(); 
        
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
            
            self.isActiveFlag(false);
            
            // Used to close the dropdown
            $("body").trigger("click");
        });
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
    
    newHome.prototype.albumSelected = function( self, album ) {
        self.getSelectedVidUUIDs( self );
        
        if( self.selectedVideos().length > 0 ) {
            self.albumLabels().forEach( function( a ) {
                a.selected( false );
            });
            album.selected( true );
            self.selectedAlbum( album );
            self.addOrCreateAlbum();    
        }
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
            } else {
                return self.selectedCity();
            }
        }
    };
    
    newHome.prototype.addOrCreateAlbum = function() {
        var self = this;
        
        if ( self.selectedVideos().length > 0 ) {
            // Create a new album
            if( self.selectedAlbum().label === 'Create New Album' ) {          
                viblio.api( '/services/album/create', { name: self.getAlbumName(), list: self.selectedVideos() } ).then( function( data ) {
                    router.navigate( 'viewAlbum?aid=' + data.album.uuid );
                });
            } else {
                // Add to an existing album
                viblio.api( '/services/album/create', { aid: self.selectedAlbum().uuid, list: self.selectedVideos() } ).then( function( data ) {
                    var vidOrVids = self.selectedVideos().length == 1 ? ' video' : ' videos';
                    var msg = self.selectedVideos().length + vidOrVids + ' successfully added to your "' + self.selectedAlbum().label + '" Album';
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
    
    // Add a new mediafile to our managed list of mediafiles
    newHome.prototype.addMediaFile = function( mf, options ) {
	var self = this;
        
        var m;
        
        // Create a new Mediafile with the data from the server
        if( options ) {
            m = new Mediafile( mf, options );
        } else {
            m = new Mediafile( mf, { show_select_badge: true, selected: true } );
        }
        
	// Register a callback for when a Mediafile is selected.
	// This is so we can deselect the previous one to create
	// a radio behavior.
	/*m.on( 'mediafile:selected',  function( sel ) {
	    self.mediaSelected( m );
	});
        
        m.on( 'mediafile:unselected', function( sel ) {
            self.mediaUnselected( m );
        });*/

	// Proxy the mediafile play event and send it along to
	// our parent.
	m.on( 'mediafile:play', function( m ) {
	    router.navigate( 'new_player?mid=' + m.media().uuid );
	});
        
	// Add it to the list
	self.videos.push( m );
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
        /*self.getAllDatesLabels();
        self.datesLabels().forEach( function( m ) {
	    m.selected( false );
	});
        self.selectedMonth('');
        self.dateFilterIsActive(false);*/
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
            } else {
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
