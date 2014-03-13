define( ['plugins/router','lib/viblio','viewmodels/mediafile', 'durandal/app', 'durandal/events', 'durandal/system', 'lib/customDialogs'], function( router,viblio, Mediafile, app, events, system, dialog ) {

    var allVids = function( cid, name ) {
	var self = this;

	self.years  = ko.observableArray([]);
        self.datesLabels  = ko.observableArray([]);
	self.months = ko.observableArray([]);
        self.monthsLabels = ko.observableArray([]);
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
        self.hits = ko.computed(function(){
            return self.videos().length;
        });
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
        self.vidsInSelectedMonth = ko.observable();
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
	
	// An edit/done label to use on the GUI
	self.editLabel = ko.observable( '<i class="icon-minus"></i> Remove...' );
        
        self.deleteModeOn = ko.computed( function() {
            if( self.editLabel() === 'Done' ) {
                return true;
            } else {
                return false;
            }
        });
        
        events.includeIn( this );
    };
    
    // Get the number of mediafiles so the allVids style can be decided on.
    // 3 or more mediafiles gets the normal view, while less than 3 gets 
    // the "Got more videos?" view.
    allVids.prototype.getHits = function() {
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
    };
    
    allVids.prototype.tagSelected = function( self, tag ) {
        console.log( tag );
        console.log( self.selectedTags() );
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
        console.log( 'triggerTagVidsSearch fired' );
        $("body").trigger("click");
        var self = this;
        if( self.selectedTags().length > 0 ) {
            self.tagsPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };
            self.tagFilterIsActive( true );
            self.allVidsIsSelected( false );
            if (self.selectedTags().length > 1 ) {
                self.currentlySelectedTag('Multiple');
            } else {
                self.currentlySelectedTag( self.selectedTags() );
            }
            self.tagVidsSearch();
        } else {
            self.tagFilterIsActive( false );
            self.allVidsIsSelected( true );
            self.showAllVideos();
        }
    };
    
    allVids.prototype.tagVidsSearch = function( month, year, cid ) {
        console.log( this.selectedTags() );
        console.log('tagVidsSearch fired');
	var self = this;
        
        self.videos.removeAll();
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
                        // Only replace the calendar when user is doing a new tag, or if they are looking at all vids/dates
                        if ( !month ) {
                            self.datesLabels.removeAll();
                            self.showingAllDatesLabels( false );
                            console.log( json );
                            self.tagsPager = json.pager;
                            json.months.forEach( function( month ) {
                                if ( month != 'Missing Dates' ) {
                                    var shortName = month.slice(0,3);
                                    var longName = month.slice(0, month.indexOf(' '));
                                    var year = month.slice(month.length-4);
                                } else {
                                    var shortName = 'No';
                                    var longName = '';
                                    var year = 'Dates';
                                }
                                self.datesLabels.push( { shortMonth: shortName, longMonth: longName, year: year, label: month, selected: ko.observable(false) } );
                            });
                        }
                        json.media.forEach( function( mf ) {
                            var m = new Mediafile( mf, { show_share_badge: true, show_delete_mode: self.deleteModeOn() } );
                            m.on( 'mediafile:play', function( m ) {
                                router.navigate( 'new_player?mid=' + m.media().uuid );
                            });
                            m.on( 'mediafile:delete', function( m ) {
                                viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
                                    viblio.mpEvent( 'delete_video' );
                                    self.videos.remove( m );
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
        });
    };
    
    allVids.prototype.goToUpload = function() {
        router.navigate( 'getApp?from=allVideos' );
    };
    
    allVids.prototype.showLoggedOutTellFriendsModal = function() {
        var args = {};
        args.placeholder = "I discovered Viblio, a great way to privately organize and share videos.  I'd love it if you signed up and shared some of your videos with me.";
        args.logout = false;
        dialog.showModal('viewmodels/loggedOutTellFriendsModal', args);
    };
    
    allVids.prototype.getShared = function() {
        var self = this;
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
        // If a tag is currently active then pass in month and keep filter
        if ( self.tagFilterIsActive() ) {
            console.log( month );
            self.tagsPager = {
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            };
            self.tagVidsSearch( month.label );
        } else {
            if ( !self.showingAllDatesLabels() ) {
                self.datesLabels.removeAll();
                self.getAllDatesLabels();
            }
            self.monthsLabels().forEach( function( m ) {
                m.selected( false );
            });
            month.selected( true );
            self.editLabel( 'Remove...' );
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
			self.monthPager = json.pager;
                        json.media.forEach( function( mf ) {
                            var m = new Mediafile( mf, { show_share_badge: true, show_delete_mode: self.deleteModeOn() } );
                            m.on( 'mediafile:play', function( m ) {
                                router.navigate( 'new_player?mid=' + m.media().uuid );
                            });
                            m.on( 'mediafile:delete', function( m ) {
                                viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
                                    viblio.mpEvent( 'delete_video' );
                                    self.videos.remove( m );
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
            console.log(data);
            data.months.forEach( function( month ) {
                var shortName = month.slice(0,3);
                var longName = month.slice(0, month.indexOf(' '));
                var year = month.slice(month.length-4);
                self.datesLabels.push( { shortMonth: shortName, longMonth: longName, year: year, label: month, selected: ko.observable(false) } );
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
        // get total number of videos
        //self.getHits();
        // get months and create labels to use as selectors
        self.getAllDatesLabels();
        
        // get years and create labels to use as selectors
        /*viblio.api( '/services/yir/years', args ).then( function(data) {
            console.log(data);
            data.years.forEach( function( year ) {
                self.yearsLabels.push( { "label": year, "selected": ko.observable(false) } );
            });   
        });*/
        // get tag labels to populate tags dropdown        
        viblio.api( '/services/filters/video_filters' ).then( function( data ) {
            data.filters.forEach( function( tag ) {
                self.tags().push( {label: tag, selected: ko.observable(false) } );
            });
        });
    };
    
    // Makes the map instructions 'sometimes sticky' - stays above the footer, otherwise always at the bottom of the window
    allVids.prototype.stickyDates = function() {       
        var maxPos = 65; //height of header
        
        var scrollTop = $(window).scrollTop(),
        elementOffset = $('.dates').offset().top,
        distance      = (elementOffset - scrollTop);

        if( distance <= maxPos ){
            $('.dates').addClass('stuck');
        }
        
        if ( ($('.allVidsPage').offset().top) - scrollTop >= 65 ){
            $('.dates').removeClass('stuck');
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
                    viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
                        viblio.mpEvent( 'delete_video' );
                        self.videos.remove( m );
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
        self.tagFilterIsActive( false );
        self.selectedTags.removeAll();
        self.currentlySelectedTag('All');
        self.getAllDatesLabels();
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
    };

    // bind to scroll() event and when scroll is 150px or less from bottom fetch more data.
    // Uses flag to determine if fetch is already in process, if so a new one will not be made 
    allVids.prototype.scrollHandler = function( event ) {
	var self = event.data;
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
