define( ['plugins/router','lib/viblio','viewmodels/mediafile', 'durandal/app', 'durandal/events', 'durandal/system', 'lib/customDialogs'], function( router,viblio, Mediafile, app, events, system, dialog ) {

    var createAlbum = function( cid, name ) {
	var self = this;
        
        self.recentUploadsIsActive = ko.observable(false);
        
        self.datesLabels  = ko.observableArray([]);
        self.showingAllDatesLabels = ko.observable(true);
        self.selectedMonth = ko.observable();
        self.dateFilterIsActive = ko.observable(false);
        
        self.facesLabels = ko.observableArray([]);
        self.selectedFace = ko.observable();
        self.currentlySelectedFace = ko.observable('All');
        self.faceFilterIsActive = ko.observable(false);
        
        self.citiesLabels = ko.observableArray([]);
        self.selectedCity = ko.observableArray([]);
        self.currentlySelectedCity = ko.observable('All');
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
        
	self.cid = cid;
        
        self.getVidsData = ko.observable();
        
        self.name = ko.observable(name);
        
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
    
    createAlbum.prototype.showRecentVids = function() {
        
    };
    
    createAlbum.prototype.recentVidsSearch = function( newSearch ) {
        
    };
    
    createAlbum.prototype.faceSelected = function( self, face ) {
        self.facesLabels().forEach( function( f ) {
            f.selected( false );
        });
        face.selected( true );
        self.selectedFace( face );    
    };
    
    createAlbum.prototype.faceVidsSearch = function( newSearch ) {
        var self = this;
        
        var face = self.selectedFace();
        
        var args = {
            contact_uuid: face.uuid
        };
        
        self.isActiveFlag(true);
        
        // Only remove all vids and reset pager if it's a new search
        if( newSearch ) {
            console.log( "New search!!" );
            self.videos.removeAll();
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
                        console.log( json );
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
            self.currentlySelectedCity('');
            
            self.isActiveFlag(false);
            
            // Used to close the dropdown
            $("body").trigger("click");
        });
    };
    
    createAlbum.prototype.monthSelected = function( self, month ) {
        self.datesLabels().forEach( function( m ) {
            m.selected( false );
        });
        month.selected( true );
        self.selectedMonth( month.label );        
    };
    
    createAlbum.prototype.monthVidsSearch = function( newSearch ) {
	var self = this;
        
        var month = self.selectedMonth();
        
        var args = {
            month: month,
            cid: self.cid
        };
        self.isActiveFlag(true);
        
        // Only remove all vids and reset pager if it's a new search
        if( newSearch ) {
            self.videos.removeAll();
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
            self.currentlySelectedCity('');
        
            self.isActiveFlag(false);
            
            // Used to close the dropdown
            $("body").trigger("click");
        });
    };
    
    createAlbum.prototype.resetSearchPager = function() {
        var self = this;
        
        self.searchPager = {
            next_page: 1,
            entries_per_page: 20,
            total_entries: -1 /* currently unknown */
        };
    };
    
    createAlbum.prototype.newVidsSearch = function() {
        var self = this;
        
        if ( !self.searchQuery() ) {
            return;
        } else {
            self.searchFilterIsActive(true);
            self.videos.removeAll();
            self.resetSearchPager();
            self.currentSearch = self.searchQuery();
            self.vidsSearch();
        }
    };
    
    createAlbum.prototype.vidsSearch = function() {
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
    
    createAlbum.prototype.clearSearch = function() {
        var self = this;
        
        self.searchFilterIsActive( false );
        self.searchQuery(null);
        self.videos.removeAll();
        
        // reset active filters
        self.recentUploadsIsActive(false);
        self.dateFilterIsActive(false);
        self.selectedMonth('');
        self.faceFilterIsActive(false);
        self.selectedFace('');
        self.allVidsIsSelected(false);
        self.currentlySelectedCity('');
    }
    
    createAlbum.prototype.nameMonths = function( month ) {
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
    }
    
    createAlbum.prototype.getAllDatesLabels = function() {
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
    
    createAlbum.prototype.getAllFacesLabels = function() {
        var self = this;
        var args = {};
        args = {
            cid: self.cid
        };
        self.facesLabels.removeAll();
        viblio.api( '/services/faces/contacts', args ).then( function(data) {
            console.log(data);
            data.faces.forEach( function( face ) {
                var _face = face;
                _face.label = face.contact_name;
                _face.selected = ko.observable( false );
                
                self.facesLabels.push( face );
            });
        });
    };
    
    createAlbum.prototype.getAllAlbumsLabels = function() {
        var self = this;
        var args = {};
        args = {
            cid: self.cid
        };
        self.albumLabels.removeAll();
        viblio.api( '/services/album/list', args ).then( function(data) {
            console.log(data);
            data.albums.forEach( function( album ) {
                console.log( album );
                var _album = album;
                _album.label = album.title;
                _album.selected = ko.observable( false );
                
                self.albumLabels.push( _album );
            });
            self.albumLabels.unshift( {label: "Create New Album", selected: ko.observable(false)} );
        });
    };
    
    createAlbum.prototype.mediaSelected = function( mf ) {
        var self = this;
        self.selectedVideos.push(mf);
        
        console.log( self.selectedVideos() );
    };
    
    createAlbum.prototype.mediaUnselected = function( mf ) {
        var self = this;
        self.selectedVideos.remove(mf);
        
        console.log( self.selectedVideos() );
    };
    
    createAlbum.prototype.getSelectedVids = function( view ) {
        var self = view;
        
        console.log( self );
        
        if ( self.selectedVideos().length > 0 ) {
            self.selectedVideos.removeAll();
        }
        
        self.videos().forEach(function(vid) {
            if( vid.selected() ) {
                self.selectedVideos.push(vid);
            }
        });
        
        console.log( self.selectedVideos() );
    };
    
    createAlbum.prototype.addToAlbum = function( parent, album, callback ) {
        var self = this;
        console.log( self );
        console.log(album);
        
        var albumMedia;
        
        self.getSelectedVids( parent );
        
        if ( parent.selectedVideos().length > 0 ) {
            console.log( 'addToAlbum is doing something');
            // Get a fresh list of media in album every time new media is added
            viblio.api( 'services/album/get?aid=' + album.uuid ).then( function( data ) {
                albumMedia = data.album.media;

                parent.selectedVideos().forEach( function( mf ) {
                    var present = false;
                    albumMedia.forEach( function( albumMf ) {
                       if( mf.view.id === albumMf.uuid ) {
                           present = true;
                       } 
                    });

                   if ( present ) {
                        // No dups!
                        return;
                   } else {
                       viblio.api( '/services/album/add_media', { aid: album.uuid, mid: mf.view.id } ).then( function() {
                            app.trigger('album:newMediaAdded', album);
                        });
                   }
                });
                if( callback ) {
                    callback();
                }
            });    
        }
    };
    
    createAlbum.prototype.createNewAlbum = function() {
        var self = this;
        
        self.getSelectedVids( self );
        
        if ( self.selectedVideos().length > 0 ) {
            viblio.api( '/services/album/create', { name: 'Click to name this album', initial_mid: self.selectedVideos()[0].media().uuid } ).then( function( data ) {
                console.log(data);
                self.addToAlbum( self, data.album, function() {
                    router.navigate( 'viewAlbum?aid=' + data.album.uuid );
                });
            });
        }
    };
    
    createAlbum.prototype.albumSelected = function( self, album ) {
        self.albumLabels().forEach( function( a ) {
            a.selected( false );
        });
        album.selected( true );
        self.selectedAlbum( album );     
    };
    
    createAlbum.prototype.addOrCreateAlbum = function() {
        var self = this;
        
        if( self.selectedAlbum().label === 'Create New Album' ) {
            self.createNewAlbum();
        } else {
            self.addToAlbum( self, self.selectedAlbum(), function() {
                var vidOrVids = self.selectedVideos().length == 1 ? ' video' : ' videos';
                var msg = self.selectedVideos().length + vidOrVids + ' successfully added to "' + self.selectedAlbum().label + '"';
                viblio.notify( msg, 'success' );
            });
            // Used to close the dropdown
            $("body").trigger("click");
        }
    };
    
    // Add a new mediafile to our managed list of mediafiles
    createAlbum.prototype.addMediaFile = function( mf ) {
	var self = this;
        
	// Create a new Mediafile with the data from the server
	var m = new Mediafile( mf, { show_select_badge: true, selected: true } );

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
    
    createAlbum.prototype.search = function() {
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
    };
    
    createAlbum.prototype.showAllVideos = function() {
        var self = this;
        $("body").trigger("click");
        self.searchFilterIsActive( false );
        self.searchQuery(null);
        self.getAllDatesLabels();
        self.datesLabels().forEach( function( m ) {
	    m.selected( false );
	});
        self.selectedMonth('');
        self.dateFilterIsActive(false);
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
    createAlbum.prototype.scrollHandler = function( event ) {
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
            if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                self.vidsSearch();
            }
        }
    };

    createAlbum.prototype.attached = function() {
	$(window).scroll( this, this.scrollHandler );
    };

    createAlbum.prototype.detached = function() {
	$(window).off( "scroll", this.scollHandler );
    };
    
    createAlbum.prototype.activate = function() {
	var self = this;
	var args = {};
        args = {
            cid: self.cid
        };

        // get months and create labels to use as selectors
        self.getAllDatesLabels();
        
        // get faces and create labels to use as filters
        self.getAllFacesLabels();
        
        // get albums and create list
        self.getAllAlbumsLabels();
    };   

    // In attached, attach the mCustomScrollbar we're presently
    // employing for this purpose.
    createAlbum.prototype.compositionComplete = function( view ) {
	var self = this;
	self.element = view;
        
        // At this point (and only at this point!) we have an accurate
	// height dimension for the scroll area and its item container.
	//self.search();
    };

    createAlbum.prototype.add_videos = function() {
	dialog.showModal( 'viewmodels/nginx-modal' );
    };
    
    // Animation callbacks
    this.showElement = function(elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn('slow'); };
    this.hideElement = function(elem) { if (elem.nodeType === 1) $(elem).fadeOut(function() { $(elem).remove(); }); };

    return createAlbum;

});
