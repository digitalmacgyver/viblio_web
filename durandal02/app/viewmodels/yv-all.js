define( ['plugins/router','lib/viblio','viewmodels/mediafile', 'durandal/app', 'durandal/events', 'durandal/system', 'lib/customDialogs'], function( router,viblio, Mediafile, app, events, system, dialog ) {

    var allVids = function( cid, name ) {
	var self = this;

        self.datesLabels  = ko.observableArray([]);
        self.showingAllDatesLabels = ko.observable(true);
        self.tags = ko.observableArray([]);
        self.selectedTags = ko.observableArray([]);
        self.currentlySelectedTag = ko.observable('All');
        self.tagFilterIsActive = ko.observable();
        self.videos = ko.observableArray([]);
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
        /*self.hits = ko.computed(function(){
            return self.videos().length;
        });*/
        self.hits = ko.observable();
        self.hasCID = ko.computed(function() {
            if (self.cid) {
                return true;
            } else {
                return false;
            }
        });
        
        //shared videos section
        self.sharedLabel = ko.observable( '<i class="icon-share"></i> Shared with me' );
        self.showShared = ko.observable( false );
        self.sections = ko.observableArray([]);
        self.numVids = ko.observable(0);
        self.showShareBtn = ko.observable(true);
        self.sharedAlreadyFetched = false;
        
        self.allVidsIsSelected = ko.observable( true );
        self.aMonthIsSelected = ko.observable(false);
        self.selectedMonth = ko.observable();
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
        
        self.tagsPager = {
	    next_page: 1,
	    entries_per_page: 20,
	    total_entries: -1 /* currently unknown */
	};
        
        self.searchPager = {};
                	
	// An edit/done label to use on the GUI
	self.editLabel = ko.observable( '<i class="icon-minus"></i> Remove...' );
        
        self.deleteModeOn = ko.computed( function() {
            if( self.editLabel() === 'Done' ) {
                return true;
            } else {
                return false;
            }
        });
        
        // Search section
        self.searchFilterIsActive = ko.observable();
        self.searchQuery = ko.observable(null);
        self.currentSearch = null;
        
        events.includeIn( this );
    };    
    
    allVids.prototype.tagSelected = function( self, tag ) {
        if ( tag.selected() ) {
            tag.selected( false );
            self.selectedTags.remove( tag.label );
            if( self.selectedTags().length == 0 ) {
                self.allVidsIsSelected( true );
            }
        } else {        
            tag.selected( true );
            self.selectedTags.push( tag.label );
            self.allVidsIsSelected( false );
        }
    };
    
    allVids.prototype.triggerTagVidsSearch = function() {
        $("body").trigger("click");
        var self = this;
        if( self.selectedTags().length > 0 ) {
            self.tagsPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };
            self.videos.removeAll();
            self.tagFilterIsActive( true );
            self.searchFilterIsActive(false);
            self.allVidsIsSelected( false );
            if (self.selectedTags().length > 1 ) {
                self.currentlySelectedTag('Multiple');
            } else {
                self.currentlySelectedTag( self.selectedTags() );
            }
            self.aMonthIsSelected( false );
            self.tagVidsSearch();
        } else {
            self.tagFilterIsActive( false );
            self.allVidsIsSelected( true );
            self.showAllVideos();
        }
    };
    
    allVids.prototype.nameMonths = function( month ) {
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
    
    allVids.prototype.resetSearchPager = function() {
        var self = this;
        
        self.searchPager = {
            next_page: 1,
            entries_per_page: 20,
            total_entries: -1 /* currently unknown */
        };
    };
    
    allVids.prototype.newVidsSearch = function() {
        var self = this;
        
        if ( !self.searchQuery() ) {
            return;
        } else {
            self.searchFilterIsActive(true);
            self.tagFilterIsActive( false );
            self.videos.removeAll();
            self.resetSearchPager();
            self.currentSearch = self.searchQuery();
            self.vidsSearch();
        }
    };
    
    allVids.prototype.vidsSearch = function() {
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
                        self.datesLabels.removeAll();
                        self.searchPager = json.pager;
                        json.media.forEach( function( mf ) {
                            var m = new Mediafile( mf, { show_share_badge: true, show_delete_mode: self.deleteModeOn() } );
                            m.on( 'mediafile:play', function( m ) {
                                router.navigate( 'new_player?mid=' + m.media().uuid );
                            });
                            m.on( 'mediafile:delete', function( m ) {
                                viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function(json) {
                                    viblio.mpEvent( 'delete_video' );
                                    self.videos.remove( m );
                                    if ( json && json.contacts ) {
                                        json.contacts.forEach( function( contact ) {
                                            app.trigger( 'top-actor:remove', contact );
                                        });
                                    }
                                });
                            });
                            self.videos.push(m);
                        });
                        dfd.resolve();
                    });
            }
            else {
                dfd.resolve();
            }
        }).promise().then(function(){
            self.isActiveFlag(false);
            //self.stickyDates();
        });    
        
    };
    
    allVids.prototype.tagVidsSearch = function( month, year, cid ) {
	var self = this;
                
        var args = {
            filters: self.selectedTags()
        };
        // Passed from monthSelected() when a tag is selected to further drill down by date
        if ( month ) {
            args.month = month;
        }
        
        self.isActiveFlag(true);
	return system.defer( function( dfd ) {
	    if ( self.tagsPager.next_page )   {
                args.page = self.tagsPager.next_page;
                args.rows = self.tagsPager.entries_per_page;
		viblio.api( '/services/filters/filter_by', args )
		    .then( function( json ) {
                        self.hits ( json.pager.total_entries );
                        // Only replace the calendar when user is doing a new tag, or if they are looking at all vids/dates
                        if ( !month ) {
                            self.datesLabels.removeAll();
                            self.showingAllDatesLabels( false );
                            json.months.forEach( function( month ) {
                                self.nameMonths( month );
                            });
                        }
                        self.tagsPager = json.pager;
                        json.media.forEach( function( mf ) {
                            var m = new Mediafile( mf, { show_share_badge: true, show_delete_mode: self.deleteModeOn() } );
                            m.on( 'mediafile:play', function( m ) {
                                router.navigate( 'new_player?mid=' + m.media().uuid );
                            });
                            m.on( 'mediafile:delete', function( m ) {
                                viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function(json) {
                                    viblio.mpEvent( 'delete_video' );
                                    self.videos.remove( m );
				    if ( json && json.contacts ) {
					json.contacts.forEach( function( contact ) {
					    app.trigger( 'top-actor:remove', contact );
					});
				    }
                                });
                            });
                            self.videos.push(m);
                        });
			dfd.resolve();
		    });
	    }
	    else {
		dfd.resolve();
	    }
	}).promise().then(function(){
            self.isActiveFlag(false);
            self.stickyDates();
        });
    };
    
    allVids.prototype.goToUpload = function() {
        router.navigate( 'getApp?from=allVideos' );
    };
    
    allVids.prototype.showLoggedOutTellFriendsModal = function() {
        var args = {};
        args.placeholder = "I discovered Viblio, a great way to privately organize and share videos.  I'd love it if you signed up and shared some of your videos with me.";
        args.logout = false;
        args.template = 15;
        dialog.showModal('viewmodels/loggedOutTellFriendsModal', args);
    };
    
    allVids.prototype.getShared = function() {
        var self = this;
        self.isActiveFlag(true);
        var args = {};
        if(self.cid) {
            args = {
                cid: self.cid
            };
        }
        return viblio.api( '/services/mediafile/all_shared', args ).then( function( data ) {
            var shared = data.shared;
            
            self.sections.removeAll();
            shared.forEach( function( share ) {
                self.numVids( self.numVids() + share.media.length );
                var mediafiles = ko.observableArray([]);
                share.media.forEach( function( mf ) {
                    var m = new Mediafile( mf, { ro: true, show_delete_mode: self.deleteModeOn() } ); //m.ro( true );
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
                    mediafiles.push( m );
                });
                share.owner.avatar = "/services/na/avatar?uid=" + share.owner.uuid + "&y=36";
                self.sections.push({ owner: share.owner, media: mediafiles });
            });
            self.sharedAlreadyFetched = true;
            self.isActiveFlag(false);
            /*if( self.numVids() < 3 ) {
                self.showShareBtn(true);
            } else {
                self.showShareBtn(false);
            }*/
        });
    };
    
     allVids.prototype.toggleShared = function() {
	var self = this;
	if ( self.sharedLabel() === 'My Videos' ) {
	    self.sharedLabel( '<i class="icon-share"></i> Shared with me' );
            self.showShared( false );
            self.editLabel( '<i class="icon-minus"></i> Remove...' );
        } else {
	    self.sharedLabel( 'My Videos' )
            self.showShared( true );
            //only fetch the shared videos once
            if(self.sharedAlreadyFetched === false) {
                self.getShared();
            }
            self.editLabel( '<i class="icon-minus"></i> Remove...' );
        }
    };
    
    // Toggle edit mode.  This will put all of media
    // files in the strip into/out of edit mode.  I'm thinking
    // this will be the way user's can delete their media files
    allVids.prototype.toggleEditMode = function() {
	var self = this;
	if ( self.editLabel() === '<i class="icon-minus"></i> Remove...' )
	    self.editLabel( 'Done' );
	else
	    self.editLabel( '<i class="icon-minus"></i> Remove...' );
        
        if( self.sharedLabel() === 'My Videos' ) {
            self.sections().forEach( function( section ) {
		section.media().forEach( function( mf ) {
                    mf.toggleEditMode();
		});
            });
        } else {
            self.videos().forEach( function( mf ) {
                mf.toggleEditMode();
            });
        }
    };
 
   allVids.prototype.monthSelected = function( self, month ) {
        self.datesLabels().forEach( function( m ) {
            m.selected( false );
        });
        month.selected( true );
        self.selectedMonth( month.label );
        self.aMonthIsSelected(true);
        self.editLabel( 'Remove...' );
        // If a tag is currently active then pass in month and keep filter
        if ( self.tagFilterIsActive() ) {
            self.tagsPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };
            self.videos.removeAll();
            self.tagVidsSearch( month.label );
        } else {
            if ( !self.showingAllDatesLabels() ) {
                self.datesLabels.removeAll();
                self.getAllDatesLabels();
            }
            self.videos.removeAll();
            // reset pager
            self.monthPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };           
            self.monthVidsSearch( self.selectedMonth() );           
            self.allVidsIsSelected(false);
        }
    };
    
    allVids.prototype.monthVidsSearch = function( month, year, cid ) {
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
                        self.hits ( json.pager.total_entries );
			self.monthPager = json.pager;
                        json.media.forEach( function( mf ) {
                            var m = new Mediafile( mf, { show_share_badge: true, show_delete_mode: self.deleteModeOn() } );
                            m.on( 'mediafile:play', function( m ) {
                                router.navigate( 'new_player?mid=' + m.media().uuid );
                            });
                            m.on( 'mediafile:delete', function( m ) {
                                viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function(json) {
                                    viblio.mpEvent( 'delete_video' );
                                    self.videos.remove( m );
				    if ( json && json.contacts ) {
					json.contacts.forEach( function( contact ) {
					    app.trigger( 'top-actor:remove', contact );
					});
				    }
                                });
                            });
                            self.videos.push(m);
                        });
			dfd.resolve();
		    });
	    }
	    else {
		dfd.resolve();
	    }
	}).promise().then(function(){
            self.isActiveFlag(false);
            self.stickyDates();
        });
    };
    
    allVids.prototype.getAllDatesLabels = function() {
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
            self.selectedTags.removeAll();
            self.currentlySelectedTag('All');
        });
    };
    
    allVids.prototype.activate = function() {
	var self = this;
	var args = {};
        args = {
            cid: self.cid
        };

        // get months and create labels to use as selectors
        self.getAllDatesLabels();

        // get tag labels to populate tags dropdown        
        viblio.api( '/services/filters/video_filters' ).then( function( data ) {
            data.filters.forEach( function( tag ) {
                self.tags().push( {label: tag, selected: ko.observable(false) } );
            });
        });
    };
    
    // Makes the dates 'sometimes sticky'
    allVids.prototype.stickyDates = function() {       
        var maxPos = 65; //height of header
        
        var scrollTop = $(window).scrollTop(),
        elementOffset = $('.dates').offset().top,
        distance      = (elementOffset - scrollTop),
        footerHeight  = ( $('#footer').offset().top ) - scrollTop;

        if( distance <= maxPos ){
            $('.dates').addClass('stuck');
            // keep the dates section above the footer
            if ( $(window).width() >= 900 ) {
                $('.dates').css( { 'height': footerHeight - 65, 'max-height': $(window).height() - 65 } );
            } else {
                $('.dates').css( { 'height': footerHeight, 'max-height': $(window).height() } );
            }            
        }
        
        if ( $(window).width() >= 900 ) {
            if ( ( $('.allVidsInner').offset().top ) - scrollTop >= 65 ){
                $('.dates').removeClass('stuck');
                $('.dates').css( { 'height': '100%' } );
            }    
        } else {
            if ( ( $('.allVidsInner').offset().top ) - scrollTop >= 0 ){
                $('.dates').removeClass('stuck');
                $('.dates').css( { 'height': '100%' } );
            }
        }
    };
    
    // Add a new mediafile to our managed list of mediafiles
    allVids.prototype.addMediaFile = function( mf ) {
	var self = this;
        
	// Create a new Mediafile with the data from the server
	var m = new Mediafile( mf, { show_share_badge: true, show_delete_mode: self.deleteModeOn() } );

	// Register a callback for when a Mediafile is selected.
	// This is so we can deselect the previous one to create
	// a radio behavior.
	m.on( 'mediafile:selected',  function( sel ) {
	    self.mediaSelected( sel );
	});

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

	// Add it to the list
	self.videos.push( m );
    };
    
    allVids.prototype.search = function() {
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
            self.stickyDates();
        });
    };
    
    allVids.prototype.isClipAvailable = function( idx ) {
	var self = this;
	if ( self.allVidsager.total_entries == -1 )
	    return false;
	return( idx >= 0 && idx < self.allVidsPager.total_entries );
    };
    
    // Scroll to the mediafile specified.
    allVids.prototype.scrollTo = function( m ) {
	var self = this;
	var scroller = $(self.element).find(".media-container");
	var item = scroller.find('#'+m.media().uuid);
	scroller.scrollTop( item.position().top + scroller.scrollTop() );
    };
    
    allVids.prototype.showAllVideos = function() {
        var self = this;
        $("body").trigger("click");
        self.tags().forEach( function( t ) {
	    t.selected( false );
	});
        self.searchFilterIsActive( false );
        self.searchQuery(null);
        self.tagFilterIsActive( false );
        self.selectedTags.removeAll();
        self.currentlySelectedTag('All');
        self.getAllDatesLabels();
        self.datesLabels().forEach( function( m ) {
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
    };

    // bind to scroll() event and when scroll is 150px or less from bottom fetch more data.
    // Uses flag to determine if fetch is already in process, if so a new one will not be made 
    allVids.prototype.scrollHandler = function( event ) {
	var self = event.data;
        
        if ( self.tagFilterIsActive() ) {
            if( self.aMonthIsSelected() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.tagVidsSearch( self.selectedMonth() );
                }
            } else {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.tagVidsSearch();
                }
            }
        } else if ( !self.showShared() && !self.searchFilterIsActive() ) {
            // If a month is not selected use the search function, else use monthVidsSearch
            if( !self.aMonthIsSelected() ) {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.search();
                }
            } else {
                if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.monthVidsSearch( self.selectedMonth() );
                }
            }    
        } else {
            if( !self.isActiveFlag() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
                    self.vidsSearch();
                }
        }
    };

    allVids.prototype.attached = function() {
	$(window).scroll( this, this.scrollHandler );
        $(window).scroll( this, this.stickyDates );
    };

    allVids.prototype.detached = function() {
	$(window).off( "scroll", this.scollHandler );
        $(window).off( "scroll", this.stickyDates );
    };

    // In attached, attach the mCustomScrollbar we're presently
    // employing for this purpose.
    allVids.prototype.compositionComplete = function( view ) {
	var self = this;
	self.element = view;
        
        // At this point (and only at this point!) we have an accurate
	// height dimension for the scroll area and its item container.
	self.search();
    };

    allVids.prototype.add_videos = function() {
	dialog.showModal( 'viewmodels/nginx-modal' );
    };
    
    // Animation callbacks
    this.showElement = function(elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn('slow'); };
    this.hideElement = function(elem) { if (elem.nodeType === 1) $(elem).fadeOut(function() { $(elem).remove(); }); };

    return allVids;

});
