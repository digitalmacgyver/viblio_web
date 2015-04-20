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
         'viewmodels/photo',
         'viewmodels/shell'], 
    
    function( router,viblio, Mediafile, app, Events, system, dialog, config, hp, PlayerPage, Photo,shell ) {

    var newHome = function( args ) {
	var self = this;
        
        self.shell = shell;
        
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
                return null;
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
        
        self.showSearchResults = ko.computed( function() {
            if( args ) {
                if( args.search ) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
        self.searchResultToShow = ko.computed(function(){
            if( args ) {
                if( args.search ) {
                    return args.search;
                } else {
                    return null;
                }
            } else {
                return null;
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
        self.create_summary_vid_mode_on = ko.observable(false);
        
        self.toolbarHeight = ko.observable( self.select_mode_on() ? $('.select-nav').height() : $('.vids-nav').height() );
        
        self.datesLabels  = ko.observableArray([]);
        self.showingAllDatesLabels = ko.observable(true);
        self.selectedMonth = ko.observable();
        
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
        
        self.citiesLabels = ko.observableArray([]);
        self.selectedCity = ko.observable();
        
        self.albumLabels = ko.observableArray();
        self.selectedAddToAlbum = ko.observable();
        self.selectedAddToAlbumLabel = ko.observable();
        
        self.albumsFilterLabels = ko.observableArray();
        self.selectedFilterAlbum = ko.observable();
        self.currentSelectedFilterAlbum = ko.observable(null);
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
        self.searchQuery = ko.observable(null);
        self.currentSearch = null;
        
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
        
        self.isActiveFlag = ko.observable(true);
        
        // Hold the pager data back from server
	// media queries.  Initialize it here so
	// the first fetch works.
        self.thePager = ko.observable({});
        self.pager_pages = ko.observableArray([]);
        self.activeFilterType = ko.observable('all');
        self.activeFilterType.subscribe( function( newVal ) {
            if( newVal == 'all' ) {
                app.trigger( 'newHome:noFiltersAreActive' );
            }
            if( newVal != 'album' ) {
                app.trigger( 'albumList:notactive' );
            }
        });
        
        self.active_filter_label = ko.computed( function() {
            if( self.activeFilterType() == 'dates' ) {
                return self.selectedMonth();
            } else if( self.activeFilterType() == 'faces' ) {
                return self.selectedFace().label;
            } else if( self.activeFilterType() == 'cities' ) {
                return self.selectedCity();
            } else if( self.activeFilterType() == 'album' ) {
                return self.selectedFilterAlbum();
            } else if( self.activeFilterType() == 'search') {
                return self.searchQuery();
            } else if( self.activeFilterType() == 'recent' ) {
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
            
            // photo view
            if( !val ) {
                self.getPhotos();
                self.photos.valueHasMutated();
            }
            
            self.photoViewFilter(null);
            self.photoViewFilter( old );
        });
        
        self.photoViewFilter = ko.observable( "some" );
        self.photoViewFilter.subscribe( function( val ) {
            // reset counter to 0
            self.visiblePhotosCount( 0 );
            if( val == "some" ) {
                self.photos().forEach( function( p ) {
                    if( p.filter() != "some" ) {
                        p.hideIt();
                    } else {
                        p.showIt();
                        p.hasBeenShown( true );
                        self.visiblePhotosCount( self.visiblePhotosCount()+1 );
                    }
                });
            } else if ( val == "more" ) {
                self.photos().forEach( function( p ) {
                    if( p.filter() == "all" ) {
                        p.hideIt();
                    } else {
                        p.showIt();
                        p.hasBeenShown( true );
                        self.visiblePhotosCount( self.visiblePhotosCount()+1 );
                    }
                });
            } else if ( val == "all" ) {
                self.photos().forEach( function( p ) {
                    p.showIt();
                    p.hasBeenShown( true );
                    self.visiblePhotosCount( self.visiblePhotosCount()+1 );
                });
            }
        });
        
        self.rawPhotos = ko.observableArray([]);
        
        self.performingNewSearch = ko.observable(true);
        
        self.tagList = ko.observableArray([]);
        self.monthTagList = ko.observableArray([]);
        self.activeTag = ko.observable( null );
        
        self.showAlbumError = ko.observable( false );
        self.albumErrorMsg = ko.observable( null );
        
        // data for feedback thumbs
        self.thumbsData = ko.computed( function() {
            var username = viblio.user().displayname;
            var email = viblio.user().email;
            var id = viblio.user().uuid;
            var filter = self.activeFilterType();
            return 'username:'+username+', email:'+email+', id:'+id+' ,filter:'+filter;
        });
        
        self.searchForVidsWithNoDates = ko.observable( false );
        self.showNoDates = ko.observable( false );
        self.noDatesSize = ko.observable( null );
                
        app.on('nginxModal:closed2', function( args ) {
            if( document.location.hash == '#home' ) {
                viblio.api('services/mediafile/list_status').then( function( data ) {
                    self.numVidsPending( data.stats.pending );
                    var num = data.stats.pending/* + data.stats.visible*/;
                    self.vidsInProcess( num );
                    if( self.vidsInProcess() > 0 && args.uploadsCompleted ) {
                        self.getRecentVids( true );
                    }
                });
            }
        });
        
        // removes a video from the user's view when a video is removed from another user's shared album
        app.on( 'album:delete_shared_album_video', function( data ) {
            var video;
            if( self.activeFilterType() == 'album' ) {
                if( self.currentAlbumAid() == data.aid ) {
                    if( findVidMatch( data.mid, self.videos() ) != 'Error' ) {
                        video = findVidMatch( data.mid, self.videos() );
                        self.videos.remove( video );
                    }
                }
            }
        });
    };
    
    // used to lookup a match in the inArray and return the matching object
    findVidMatch = function( find, inArray ) {
        var match = ko.utils.arrayFirst( inArray, function( a ) {
            return a.media().uuid === find;
        });
        if (match) {
            return match;  
        } else {
            return 'Error';
        }    
    };
    
    newHome.prototype.toggleVideoMode = function() {
        var self = this;
        
        self.video_mode_on(true);
    };
    
    newHome.prototype.togglePhotoMode = function() {
        var self = this;
        
        var prev = self.albumIsShared();
        
        self.video_mode_on(false);
        self.albumIsShared( false );
        self.albumIsShared( prev );
    };
    
    newHome.prototype.getVidsInProcess = function() {
        var self = this;
        
        viblio.api('services/mediafile/list_status').then( function( data ) {
            self.numVidsPending( data.stats.pending );
            var num = data.stats.pending/* + data.stats.visible*/;
            self.vidsInProcess( num );
        });
    };

    newHome.prototype.toggle_find_options = function() {
        var self = this;
        
        if( self.show_find_options() ) {
            self.show_find_options( false );
        } else {
            self.show_find_options( true );
        }
    };
    
    newHome.prototype.handleTags = function( tags ) {
        var self = this;
        
        var obj;
        var set;
        var max_tags_frequency = 0;
        var min_tags_frequency = 99999999;
        var max_months_frequency = 0;
        var min_months_frequency = 99999999;
        var min_font_size = 10;
        var max_font_size = 30;
        var arr = [];
        var monthNames = ['January ', 'February ', 'March ', 'April ', 'May ', 'June ', 'July ', 'August ', 'September ', 'October ', 'November ', 'December '];
        var months = [];
        var regEx;
        
        function containsRegex(a, regex){
            var l = a.length
            for(var i = 0; i < l; i++) {
              if(a[i].search(regex) > -1){
                return i;
              }
            }
            return -1;
        }
        
        function getLabelSize( frequency, minFrequency, maxFrequency ) {
            frequency = Number( frequency );
            minFrequency = Number( minFrequency );
            maxFrequency = Number( maxFrequency );
            if( minFrequency == maxFrequency && maxFrequency > 1 ) {
                return max_font_size + "pt";
            } else {
                var weight = ( frequency - minFrequency ) / ( maxFrequency - minFrequency );
                var fontSize = min_font_size + Math.round( ( max_font_size - min_font_size ) * weight );
                return fontSize + "pt";     
            }
        }
        
        return system.defer( function( dfd ) { 
            for( var obj in tags ) {
                var num = Number( tags[obj] );
                set = {
                    name: viblio.unescapeHtml( viblio.unescapeHtml(obj) ),
                    freq: num,
                    fontSize: null,
                    selected: ko.observable( false )
                };
                // handle months
                if( obj.indexOf( ' ' ) > 0 ) {
                    regEx = obj.slice( 0, obj.indexOf( ' ' )+1 );
                    if( containsRegex( monthNames, regEx ) >= 0 ) {
                        if( num > max_months_frequency ) {
                            max_months_frequency = num;
                        }
                        if( num < min_months_frequency ) {
                            min_months_frequency = num;
                        }
                        months.push( set );  
                    }
                    // handle other tags
                    else {
                        // treat "No Dates" tag as a date
                        if( obj == 'No Dates' ) {
                            if( num > max_months_frequency ) {
                                max_months_frequency = num;
                            }
                            if( num < min_months_frequency ) {
                                min_months_frequency = num;
                            }
                            months.push( set );      
                        }
                        // handle other tags
                        else {
                            if( num > max_tags_frequency ) {
                                max_tags_frequency = num;
                            }
                            if( num < min_tags_frequency ) {
                                min_tags_frequency = num;
                            }
                            arr.push( set );      
                        }  
                    }
                }
                // handle other tags
                else {
                    set.truncate = true;
                    if( num > max_tags_frequency ) {
                        max_tags_frequency = num;
                    }
                    if( num < min_tags_frequency ) {
                        min_tags_frequency = num;
                    }
                    arr.push( set );    
                }
            }
            //self.tagList( set );
            dfd.resolve( arr, months );
        }).promise().then( function( tags, months ) {
            //set tag size
            tags.forEach( function( tag ) {
                tag.fontSize = getLabelSize( tag.freq, min_tags_frequency, max_tags_frequency );
            });
            self.tagList( tags );
            // sort the tags alphabetically
            self.tagList.sort(function(left, right) { return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1) });
            
            months.forEach( function( tag ) {
                // add a unix timestamp to sort by
                tag.date = moment( tag.name, "MMMM YYYY" ).unix();
                tag.fontSize = getLabelSize( tag.freq, min_months_frequency, max_months_frequency );
                // grab the sizing for the "No Dates" tag and save it, then remove it from the array
                if( tag.name == "No Dates" ) {
                    // grab the size
                    self.noDatesSize( tag.fontSize );
                    // then remove it
                    months.splice( months.indexOf( tag ), 1 );
                }
            });
            self.monthTagList( months );
            // sort chronalogically
            self.monthTagList.sort(function(left, right) { return left.date == right.date ? 0 : (left.date < right.date ? -1 : 1) })
        });
    };
    
    newHome.prototype.tagSearch = function( tag ) {
        var self = this;
        var args;
        
        if( self.isActiveFlag() )
            return;
        
        // unselect all tags
        self.tagList().forEach( function( tag ) {
            tag.selected( false );
        });
        self.monthTagList().forEach( function( tag ) {
            tag.selected( false );
        });
        
        tag.selected( true );
        
        // remove all photos since this does not run through the filterVidsSearchPage() function which normally clears out the photos 
        self.videos.removeAll();
        self.photos.removeAll();
        
        self.searchForVidsWithNoDates( false );
        
        self.activeTag( tag.name );
        
        // base the search args off of the lastSearchObj - this is created when a search is performed
        // and contains all relevent search info
        args = self.lastSearchObj.args;
        // override the page 1
        args.page = 1;
        // Add the tags parameter
        args['tags[]'] = [tag.name];
        // clear out no_dates if it's there
        if( args.no_dates ) {
            delete args.no_dates;
        }
        
        self.filterVidsSearch( self.lastSearchObj.type, args, self.lastSearchObj.api, false, true );
    }; 
    
    newHome.prototype.clearTag = function() {
        var self = this;
        
        if( self.isActiveFlag() )
            return;
        
        //self.albumVidsSearch( true, true );
        
        var args = self.lastSearchObj.args;
        if( args['tags[]'] ) {
            delete args['tags[]'];
        }
        self.activeTag( null );
        self.filterVidsSearch( self.lastSearchObj.type, args, self.lastSearchObj.api, true, true );
    };

    newHome.prototype.getPhotos = function() {
        var self = this;
        
        var defs = [];
        var arr = [];
        var args, newArr;
        
        if( self.photos().length != 0 ) {
            return;
        }
        
        self.rawPhotos().forEach( function( set ) {
            defs.push( self.some_more_all( set.mf, set.images ) );
        });
        $.when.apply($, defs).done(function( res ) {
            args = Array.prototype.slice.call(arguments, 0);
            newArr = args.sort();
            
            newArr.forEach( function( set ) {
                set.arr.forEach( function( p ) {
                    arr.push( self.addPhoto( p, self.mfOwnedByViewer( set.mf ) ? { ownedByViewer: true } : { ownedByViewer: false, owner_uuid: set.mf.owner_uuid } ) );
                });
            });
            
            self.photos( arr );
        });
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
        return system.defer( function( dfd ) { 
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

            var set = {
                mf: mf,
                arr: results
            };

            dfd.resolve( set );
        });
    };
    
    /*newHome.prototype.monthSelected = function( self, month ) {
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
            self.activeFilterType('dates');
            args = {
                month: self.selectedMonth(),
                cid: self.cid
            };
            self.filterVidsSearch( 'dates', args, '/services/yir/videos_for_month', true, null );
        }
    };*/
    
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
                self.activeFilterType('faces');
                args = {
                    contact_uuid: self.selectedFace().uuid
                };
                self.filterVidsSearch( 'faces', args, '/services/faces/media_face_appears_in', true, null );
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
            self.activeFilterType('cities');
            if( self.selectedCity() != 'Location not set') {
                args = {
                    q: self.selectedCity()
                };    
            } else {
                args = {
                    no_location: 1
                };
            }
            
            self.filterVidsSearch( 'cities', args, '/services/mediafile/taken_in_city', true, null );
        }         
    };
    
    newHome.prototype.newVidsSearch = function() {
        var self = this;
        var args;
        
        if ( !self.searchQuery() ) {
            return;
        } else {          
            self.videos.removeAll();
            //self.photos.removeAll();
            self.currentSearch = self.searchQuery();
            self.activeFilterType('search');
            args = {
                q: self.currentSearch
            };
            self.filterVidsSearch( null, args, '/services/mediafile/search_by_title_or_description', true, null );
        }
    };
    
    newHome.prototype.getRecentVids = function( newSearch, source ) {
        var self = this;
        var args;
        
        self.activeFilterType('recent');
        
        args = {};
        if( self.vidsInProcess() > 0 ) {
            args.only_videos = 1;
            args['status[]'] = ['pending', 'visible', 'complete'];
        }
        self.filterVidsSearch( 'recent', args, '/services/mediafile/recently_uploaded', newSearch, null );
        
        // record mixpanel event
        viblio.mpEvent( 'Get recent videos', {from: source} );
    };
    
    newHome.prototype.showAllVideos = function( source ) {
        var self = this;
        var args;
        var apiCall;
        
        self.activeFilterType('all');
        
        self.searchForVidsWithNoDates( false );
        
        args = {};
        if( self.cid ) {
            args.contact_uuid = self.cid;
            apiCall = '/services/faces/media_face_appears_in';
        } else {
            args.views = ['poster'];
            apiCall = '/services/mediafile/list_all';
        }
        self.filterVidsSearch( 'all', args, apiCall, true, null );
        
        // record mixpanel event
        viblio.mpEvent( 'Get all videos', {from: source} );
    };
    
    newHome.prototype.albumVidsSearch = function( newSearch, scrollToTop ) {
        var self = this;
        var args;
        var errorCallback = function( res, data ) {
            self.showAlbumErrorFunc( data.code );
        };
        // set the code below in the filterVidsSearch() function AFTER the album has been fetched.
        //self.activeFilterType('album');
        
        // set the activeTag to null
        if( newSearch ) {
            //self.activeTag( null );
            self.searchForVidsWithNoDates( false );
        }
        
        args = {};
        args.aid = self.currentAlbumAid();
        self.filterVidsSearch( 'album', args, 'services/album/get', newSearch, scrollToTop, errorCallback );
    }; 
    
    newHome.prototype.noDatesSearch = function(  ) {
        var self = this;
        var args;
        
        if( self.isActiveFlag() )
            return;
        
        self.searchForVidsWithNoDates( true );
        
        // remove all photos since this does not run through the filterVidsSearchPage() function which normally clears out the photos 
        self.photos.removeAll();
        
        /*args = {
            no_dates: 1
        };
        if( self.activeFilterType() === 'album' ) {
            args.aid = self.currentAlbumAid();
            self.filterVidsSearch( 'album', args, 'services/album/get', true, true );    
        } else if( self.activeFilterType() === 'all' ) {
            args.views = ['poster'];
            self.filterVidsSearch( 'all', args, '/services/mediafile/list_all', true, true );
        }*/
        
        // base the search args off of the lastSearchObj - this is created when a search is performed
        // and contains all relevent search info
        args = self.lastSearchObj.args;
        // override the page to 1
        args.page = 1;
        // Add the no_dates parameter
        args.no_dates = 1
        // clear out the tag
        if( args['tags[]'] ) {
            delete args['tags[]'];
        }
        
        self.filterVidsSearch( self.lastSearchObj.type, args, self.lastSearchObj.api, true, true );
    };
    
    newHome.prototype.clearNoDates = function() {
        var self = this;
        
        if( self.isActiveFlag() )
            return;
        
        /*if( self.activeFilterType() === 'album' ) {
            self.albumVidsSearch( true, true );    
        } else if( self.activeFilterType() === 'all' ) {
            self.showAllVideos()
        }*/
        
        var args = self.lastSearchObj.args;
        if( args.no_dates ) {
            delete args.no_dates;
        }
        self.searchForVidsWithNoDates( false );
        self.filterVidsSearch( self.lastSearchObj.type, args, self.lastSearchObj.api, true, true );
    };
    
    newHome.prototype.showAlbumErrorFunc = function( code ) {
        var self = this;
        
        self.performingNewSearch(false);
        self.isActiveFlag(false);
        if( code == '403' ) {
            self.albumErrorMsg( 'private' );
        } else if ( code == '404' ) {
            self.albumErrorMsg( 'unavailable' );
        }
        //this strips the aid params off of the url after navigation
        router.navigate('#home', { trigger: false, replace: true });   
        self.showAlbumError(true);
    };
    
    /*
     * @param {string} type - one of: "dates", "faces", "cities", "recent", "all" or null 
     * @param {object} args - the args to be sent along with the api call
     * @param {string} api - the endpoint to call
     * @param {bool} newSearch - whether to run a fresh search or not
     * @param {bool} scrollToTop - whether to scroll to the top of the videos/photos section after the search or not 
     */
    newHome.prototype.filterVidsSearch = function( type, args, api, newSearch, scrollToTop, errorCallback ) {
	var self = this;
        // this creates an object with all needed parameters to the current search
        self.lastSearchObj = {
            type: type,
            args: args,
            api: api,
            newSearch: newSearch,
            scrollToTop: scrollToTop,
            errorCallback: errorCallback
        };
        var media;
        var tags;
        self.isActiveFlag(true);
        
        // Only remove all vids and reset pager if it's a new search
        if( newSearch ) {
            self.performingNewSearch( true );
            //clear the search contents - only if there is a type - if type is null this means it's a search, so keep the current search term
            if( type ) {
                self.clearSearch();
            }
            
            // reset the activeTag to null
            self.activeTag( null );
            // handle no dates search
            self.searchForVidsWithNoDates( args.no_dates ? true : false );
            
            // remove all videos and images
            self.videos.removeAll();
            self.photos.removeAll();
            // reset pager
            self.thePager({
                next_page: 1,
                entries_per_page: 20,
                total_entries: -1 /* currently unknown */
            });
        }
        
	return system.defer( function( dfd ) {
            var photosArr = [];
            args.page = args.page ? args.page : 1;
            args.rows = self.thePager().entries_per_page;
            args.include_tags = 1;
            args.include_contact_info = 1;
            args.include_images = config.photo_throttle;
            viblio.api( api, args, errorCallback ? errorCallback : null )
                .then( function( json ) {
                    self.showNoDates( json.no_date_return ? json.no_date_return : false );
                    self.hits ( json.pager.total_entries ? json.pager.total_entries : 0 );
                    self.handlePager( json.pager, newSearch || args.updatePager, args.updatePager );
                    tags = json.all_tags;
                    if( type == 'album' ) {
                        self.currentAlbum( json.album );
                        self.albumIsShared( json.album.is_shared ? true : false );
                        //tags = json.all_tags;
                        self.activeFilterType('album');
                        if( json.album.media.length > 0 ) {
                            json.album.media.forEach( function( mf ) {
                                self.addAlbumMediaFile ( mf );
                                if( mf.views.image ) {
                                    photosArr.push({
                                        mf: mf,
                                        images: mf.views.image 
                                    });
                                    //self.some_more_all( mf, mf.views.image );
                                }
                            });
                            self.videos.valueHasMutated();
                            dfd.resolve( 'album', photosArr );
                        } else {
                            dfd.resolve( 'album', photosArr );
                        } 
                    } else {
                        // set the activeTag to null
                        //self.activeTag( null );
                        
                        if(json.albums){
                            json.media = json.albums;
                        }
                        json.media.forEach( function( mf ) {
                            self.addMediaFile ( mf );
                            if( mf.views.image ) {
                                photosArr.push({
                                    mf: mf,
                                    images: mf.views.image 
                                });
                                //self.some_more_all( mf, mf.views.image );
                            }
                        });
                        self.videos.valueHasMutated();
                        dfd.resolve( 'other', photosArr );
                    }
                });
	}).promise()
        .done(function( res, photosArr ){
            // the api worked, so make sure album error is hidden
            self.showAlbumError(false);
            // album searches
            if( res == 'album' ) {
                self.current_album_is_empty( false );
            }
            // all searches other than album
            else {
                // this section handles the cover photos section - if the type is not all then show a slideshow
                if( type && type != "all" ) {
                    app.trigger( 'newHome:filtersAreActive', media );
                }

                // this section handles the cover avatar section - calling it here gets the timing correct when exiting from an album
                if( !type || ( type && type != "faces" ) ) {
                    app.trigger( 'selectedFace:notactive' );
                }
            }
            
            self.resetOtherFilters( type );
            
            if( self.videos().length > 0 ) {
                self.performingNewSearch( false );
                $.when( self.videos()[self.videos().length-1].viewResolved ).then( function() {
                    self.isActiveFlag(false);
                    // scroll to the top of the page
                    if( scrollToTop ) {
                        viblio.goTo( $('.allVidsPage'), -65 );
                    }
                });
            } else {
                self.isActiveFlag(false);
                self.performingNewSearch( false );
                // scroll to the top of the page
                if( scrollToTop ) {
                    viblio.goTo( $('.allVidsPage'), -65 );
                }
            }
            
            // handle the photos now
            self.rawPhotos( photosArr );
            if( !self.video_mode_on() ) {
                self.getPhotos();
                self.photos.valueHasMutated();
            }
            
            // handle tags
            if( newSearch ) {
                self.handleTags( tags );
            }
            
            // tickle the photos filter
            var old = self.photoViewFilter();
            self.photoViewFilter(null);
            self.photoViewFilter( old );

            /*if( type == "all" ) {
                setTimeout(function(){
                    self.setTitleMargin();
                }, 300);    
            }*/
            
            self.setTitleMargin();
        })
        // if the album is empty then show dialog, when button is clicked drop into select mode from all videos 
        .fail(function( res ){
            if( res == 'album' ) {
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
            }
        });
    };
    
    newHome.prototype.resetOtherFilters = function( exception ) {
        var self = this; 
        
        if( exception != "album" ) {
            self.selectedFilterAlbum('');    
        }
            
        if( exception == "dates" ) {
            self.selectedFace('');
            self.facesLabels().forEach( function( f ) {
                f.selected( false );
            });
            self.selectedCity('');
            self.citiesLabels().forEach( function( c ) {
                c.selected( false );
            });
        } else if ( exception == "faces" ) {
            self.selectedMonth('');
            self.datesLabels().forEach( function( m ) {
                m.selected( false );
            });
            self.selectedCity('');
            self.citiesLabels().forEach( function( c ) {
                c.selected( false );
            });
        } else if ( exception == "cities" ) {
            self.selectedMonth('');
            self.datesLabels().forEach( function( m ) {
                m.selected( false );
            });
            self.selectedFace('');
            self.facesLabels().forEach( function( f ) {
                f.selected( false );
            });
        } else if ( !exception || exception == "search" || exception == "recent" || exception == "all" || exception == "album" ) {
            self.selectedMonth('');
            self.datesLabels().forEach( function( m ) {
                m.selected( false );
            });
            self.selectedFace('');
            self.facesLabels().forEach( function( f ) {
                f.selected( false );
            });
            self.selectedCity('');
            self.citiesLabels().forEach( function( c ) {
                c.selected( false );
            });
        }
    };
        
    newHome.prototype.handlePager = function( pager, newSearch, redraw ) {
        var self = this;
        
        self.thePager( pager );
        $('.paginationContainer').pagination( 'updateItems', pager.total_entries );
        $('.paginationContainer').pagination( 'updateItemsOnPage', pager.entries_per_page );
        $('.paginationContainer').pagination( 'drawPage', Number(pager.current_page) );
        
        // hide the pager prev and next buttons when there is only 1 page of results
        if( self.thePager().last_page == 1 ) {
            $( self.element ).find( '.paginationContainer .prev, .paginationContainer .next' ).hide();
        }
    };
    
    newHome.prototype.filterVidsSearchPage = function( page, skipPageCheck, scrollToTop ) {
        var self = this;
        
        // this will dismiss any requests if the current fetch is not finished yet
        if( self.isActiveFlag() /*|| typeof page != 'number'*/ ) {
            return;
        }
        
        var args = {
            page: page
        }
        // handle tags
        if( self.activeTag() ) {
            args['tags[]'] = [self.activeTag()];
        }
        // only return videos without dates
        if( self.searchForVidsWithNoDates() ) {
            args.no_dates = 1; 
        }
        var apiCall;
        
        if ( skipPageCheck ? page : (page && page <= self.thePager().last_page) && (page && page != self.thePager().current_page) )   {
            // clear out current videos
            self.videos.removeAll();
            self.photos.removeAll();
            
            // deactivate select all mode when going to a new page, unless in the recent filter
            if( self.activeFilterType() != 'recent' ) {
                self.select_all_mode_is_on( false );
            } else {
                self.select_all_mode_is_on( true );
            }
            
            // Dates
            if( self.activeFilterType() == 'dates' ) {
                args.month = self.selectedMonth();
                args.cid = self.cid;
                self.filterVidsSearch( 'dates', args, '/services/yir/videos_for_month', null, scrollToTop );
            }
            // Faces
            else if( self.activeFilterType() == 'faces' ) {
                args.contact_uuid = self.selectedFace().uuid;
                self.filterVidsSearch( 'faces', args, '/services/faces/media_face_appears_in', null, scrollToTop  );
            }
            // Cities
            else if( self.activeFilterType() == 'cities' ) {
                if( self.selectedCity() == 'Location not set' ) {
                    args.no_location = 1;
                } else {
                    args.q = self.selectedCity();
                }
                self.filterVidsSearch( 'cities', args, '/services/mediafile/taken_in_city', null, scrollToTop );
            }
            // Search
            else if( self.activeFilterType() == 'search' ) {
                self.currentSearch = self.searchQuery();
                args.q = self.currentSearch;
                self.filterVidsSearch( null, args, '/services/mediafile/search_by_title_or_description', null, scrollToTop );
            }
            // Recent
            else if( self.activeFilterType() == 'recent' ) {
                if( self.vidsInProcess() > 0 ) {
                    args.only_videos = 1;
                    args['status[]'] = ['pending', 'visible', 'complete'];
                }
                self.filterVidsSearch( 'recent', args, '/services/mediafile/recently_uploaded', null, scrollToTop );
            }
            // All
            else if( self.activeFilterType() == 'all' ) {
                if( self.cid ) {
                    args.contact_uuid = self.cid;
                    apiCall = '/services/faces/media_face_appears_in';
                } else {
                    args.views = ['poster'];
                    apiCall = '/services/mediafile/list_all';
                }
                self.filterVidsSearch( 'all', args, apiCall, null, scrollToTop );
            }
            // Albums
            else if( self.activeFilterType() == 'album' ) {
                args.aid = self.currentAlbumAid();
                args.updatePager = skipPageCheck;
                self.filterVidsSearch( 'album', args, 'services/album/get', null, scrollToTop );
            }
        }
    };
    
    newHome.prototype.clearSearch = function( andFilter ) {
        var self = this;
        
        self.searchQuery(null);
        self.videos.removeAll();
        //self.photos.removeAll();
        
        if( andFilter ) {
            self.clearfilters();
        }
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
        var options = {};
	// Create a new Mediafile with the data from the server - Only albums owned by the viewer will be given the share badge

	//var m = new Mediafile( mf, self.mfOwnedByViewer(mf) ? { show_share_badge: !self.select_mode_on(), show_preview: true, show_faces_tags: true, ownedByViewer: true, show_select_badge: self.select_mode_on(), selected: self.select_all_mode_is_on() ? true : self.selectedVideos().indexOf( mf.uuid ) != -1 ? true : false, popup_player: true, clean_style: true } : { show_preview: true, ro: true, show_faces_tags: true, shared_style: true, owner_uuid: mf.owner_uuid, show_select_badge: self.select_mode_on(), selected: self.select_all_mode_is_on(), popup_player: true, clean_style: true } );	
        
        if( self.mfOwnedByViewer(mf) ) {
            options = { 
                show_share_badge: !self.select_mode_on(), 
                show_preview: true, 
                show_faces_tags: true, 
                ownedByViewer: true, 
                show_select_badge: self.select_mode_on(), 
                selected: self.select_all_mode_is_on() ? true : self.selectedVideos().indexOf( mf.uuid ) != -1 ? true : false, 
                popup_player: head.mobile ? false: true,
                clean_style: true,
                show_predefined_tags: viblio.user().user_type == 'individual' ? true : false,
                select_mode_on: self.select_mode_on()
            };
        } 
        // mf is shared with user
        else {
            options = {
                show_preview: true, 
                ro: true, 
                show_faces_tags: true, 
                shared_style: true, 
                owner_uuid: mf.owner_uuid,
                show_select_badge: self.albumIsShared() ? false : self.delete_mode_on() ? self.select_mode_on() : false,
                selected: self.select_all_mode_is_on(), 
                popup_player: head.mobile ? false: true,
                clean_style: true,
                select_mode_on: self.select_mode_on()
            };
        }
        var m = new Mediafile( mf, options );
	// Play a mediafile clip.  This uses the query parameter
	// passing technique to pass in the mediafile to play.
	/*m.on( 'mediafile:play', function( m ) {
	    if ( m.media().owner_uuid == viblio.user().uuid )
		router.navigate( 'new_player?mid=' + m.media().uuid );
	    else
		router.navigate( 'web_player?mid=' + m.media().uuid );
	});*/
        
        m.on( 'mediafile:play', function( m ) {
            // If select mode is on, then only select the video
            if( self.select_mode_on() ) {
                // only allow selection if the select badge is showing
                if( m.show_select_badge() ) {
                    m.selected() ? m.unselect() : m.select();
                }
            }
            // else trigger the play action
            else {
                if( head.mobile ) {
                    router.navigate( 'phone?mid=' + m.media().uuid );
                } else {
                    self.playingVid( m );
                    self.playingVidIndex( self.videos().indexOf( m ) );
                    self.playingVidUUID( m.media().uuid );
                }    
            }
        });
        
        // in this case the deferred (dfd) is created in the actual mediafile (mediafile.js) itself and it is resolved once the api call has been made
        m.on( 'mediafile:delete', function( m, dfd ) {
            return viblio.api( '/services/album/remove_media?', { aid: self.currentAlbumAid(), mid: m.media().uuid } ).then( function() {
                viblio.mpEvent( 'remove_video_from_album' );
                // Remove from allVids
                self.videos.remove( m );
                // resolve the deferred that was passed in
                dfd.resolve();
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
        var options = {};
        if( mf.status == 'failed' ) {
            return;
        }   
        if( mf.is_shared == 1 ) {
            // Shared with user
            options = {
                ro: true,
                shared_style: true,
                owner_uuid: mf.owner_uuid,
                show_faces_tags: true,
                show_select_badge: self.delete_mode_on() ? self.select_mode_on() : false,
                selected: self.delete_mode_on() ? self.select_all_mode_is_on() : false,
                popup_player: head.mobile ? false: true, 
                clean_style: true,
                select_mode_on: self.select_mode_on()
            }
            var m = new Mediafile( mf, options ); //m.ro( true );
            // in this case the deferred (dfd) is created in the actual mediafile (mediafile.js) itself and it is resolved once the api call has been made
            m.on( 'mediafile:delete', function( m, dfd ) {
                return viblio.api( '/services/mediafile/delete_share', { mid: m.media().uuid } ).then( function( data ) {
                    viblio.mpEvent( 'delete_share' );
                    self.videos.remove( m );
                    self.hits( self.hits()-1 );
                    // resolve the deferred that was passed in
                    dfd.resolve();
                });
            });    
        } else {
            // Owned by user
            options = { 
                show_share_badge: !self.select_mode_on(), 
                show_select_badge: self.select_mode_on(), 
                show_faces_tags: true, 
                ownedByViewer: true, 
                selected: self.select_all_mode_is_on() ? true : self.selectedVideos().indexOf( mf.uuid ) != -1 ? true : false, 
                in_process_style: mf.status == 'pending' ? true : false, 
                popup_player: head.mobile ? false: true,
                clean_style: true,
                show_predefined_tags: viblio.user().user_type == 'individual' ? true : false,
                select_mode_on: self.select_mode_on()
            };
            var m = new Mediafile( mf, options );
            m.on( 'mediafile:delete', function( m, dfd ) {
                viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function( json ) {
                    viblio.mpEvent( 'delete_video' );
                    self.videos.remove( m );
                    self.hits( self.hits()-1 );
                    if ( json && json.contacts ) {
                        json.contacts.forEach( function( contact ) {
                            app.trigger( 'top-actor:remove', contact );
                        });
                    }
                    // resolve the deferred that was passed in
                    dfd.resolve();
                });
            });
        }
        
        m.on( 'mediafile:play', function( m ) {
            // If select mode is on, then only select the video
            if( self.select_mode_on() ) {
                // only allow selection if the select badge is showing
                if( m.show_select_badge() ) {
                    m.selected() ? m.unselect() : m.select();
                }
            } 
            // else trigger the play action
            else {
                if( head.mobile ) {
                    router.navigate( 'phone?mid=' + m.media().uuid );
                } else {
                    self.playingVid( m );
                    self.playingVidIndex( self.videos().indexOf( m ) );
                    self.playingVidUUID( m.media().uuid );
                }    
            }
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
        
	// Add it to the list - push directly into the underlying array, not the observable
        var innerArray = self.videos()
	innerArray.push( m );
        
        // If select all mode is on when new vids are added then add them to the selected array too - only if owned by viewer
        if( self.select_all_mode_is_on() && self.select_mode_on() ) {
            if( self.delete_mode_on() ){
                if( self.selectedVideos().indexOf( m.media().uuid ) == -1 ) {
                    self.selectedVideos.push( m.media().uuid );
                }
            } else {
                if( self.mfOwnedByViewer( m ) ) {
                    if( self.selectedVideos().indexOf( m.media().uuid ) == -1 ) {
                        self.selectedVideos.push( m.media().uuid );
                    }
                }    
            }
        } 
    };
    
    newHome.prototype.addPhoto = function( ph, options ) {
	var self = this;
        
	// Create a new Photo with the data from the server
	var p = new Photo( ph, options.ownedByViewer ? { ownedByViewer: true, show_select_badge: self.select_mode_on(), selected: self.select_all_mode_is_on() ? true : self.selectedPhotos().indexOf( ph.uuid ) != -1 ? true : false } : { owner_uuid: options.owner_uuid, show_select_badge: self.delete_mode_on() ? self.select_mode_on() : false, selected: self.delete_mode_on() ? self.select_all_mode_is_on() : false } );

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
            if( self.select_mode_on() ) {
                // only allow selection if the select badge is showing
                if( p.show_select_badge() ) {
                    p.selected() ? p.unselect() : p.select();
                }
            }
	});
        
        p.on( 'photo:delete', function( p ) {
            viblio.api( 'services/mediafile/delete_assets', { 'assets[]': p.media().uuid } ).then( function( json ) {
                viblio.mpEvent( 'delete_photo' );
                self.photos.remove( p );
                self.visiblePhotosCount( self.visiblePhotosCount()-1 );
            });
        });

        // Add it to the list - push directly into the underlying array, not the observable
        /*var innerArray = self.photos()
	innerArray.push( p );*/
        
        // If select all mode is on when new photos are added then add them to the selected array too - only if owned by viewer
        if( self.select_all_mode_is_on() && self.select_mode_on() ) {
            if( self.delete_mode_on() ){
                if( self.photoViewFilter() == "some" ) {
                    if( p.filter() == "some" ) {
                        if( self.selectedPhotos().indexOf( p.media().uuid ) == -1 ) {
                            self.selectedPhotos.push( p.media().uuid );
                        } 
                    }
                } else if ( self.photoViewFilter() == "more" ) {
                    if( p.filter() != "all" ) {
                        if( self.selectedPhotos().indexOf( p.media().uuid ) == -1 ) {
                            self.selectedPhotos.push( p.media().uuid );
                        } 
                    }
                } else {
                    if( self.selectedPhotos().indexOf( p.media().uuid ) == -1 ) {
                        self.selectedPhotos.push( p.media().uuid );
                    } 
                }
            } else {
                if( options.ownedByViewer ) {
                    if( self.photoViewFilter() == "some" ) {
                        if( p.filter() == "some" ) {
                            if( self.selectedPhotos().indexOf( p.media().uuid ) == -1 ) {
                                self.selectedPhotos.push( p.media().uuid );
                            } 
                        }
                    } else if ( self.photoViewFilter() == "more" ) {
                        if( p.filter() != "all" ) {
                            if( self.selectedPhotos().indexOf( p.media().uuid ) == -1 ) {
                                self.selectedPhotos.push( p.media().uuid );
                            }
                        }
                    } else {
                        if( self.selectedPhotos().indexOf( p.media().uuid ) == -1 ) {
                            self.selectedPhotos.push( p.media().uuid );
                        } 
                    }
                }    
            }
        }
        
        return p;
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
            self.photos().forEach( function( photo ) {
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
        
        self.videos().forEach( function( mf ) {
            mf.turnOffSelectMode();
        });
        self.photos().forEach( function( photo ) {
            photo.turnOffSelectMode();
        });
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
        self.create_summary_vid_mode_on(false);
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
        if( self.activeFilterType() == 'recent' ) {
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
        if( type == 'summary' ) {
            self.create_summary_vid_mode_on(true);
        }
        self.add_to_mode_on(true);
    };
    
    newHome.prototype.delete_mode = function() {
        var self = this;
        
        self.clear_all_modes();
        self.delete_mode_on(true);
        
        // If an album is selected AND it's not owned by the user then only select user's vids
        if( self.activeFilterType() == 'album' && self.currentSelectedFilterAlbum().shared == 1 ) {
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
            message = 'If you delete this album, individual videos are not deleted, but no one you shared this album with will be able to see this collection anymore. <br /> Do you want to continue?';
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
        var albumOrAccount = self.activeFilterType() == 'album' ? 'this album' : 'your account';
        var message = 'Are you sure you want to remove ' + len + ( len == 1 ? (self.video_mode_on() ? ' video' : ' photo') :  (self.video_mode_on() ? ' videos' : ' photos') ) + ' from ' + albumOrAccount + '?';
        var deleteArr = [];
        
        if( len > 0 ) {
            app.showMessage( message, 'Delete Confirmation', ['Yes', 'No']).then( function( data ) {
                if( data == 'Yes' ){
                    // videos
                    if( self.video_mode_on() ) {
                        self.videos().forEach( function( mf ) {
                            if( mf.selected() ) {
                                // create an array of deferreds (a deferred is created and resolved when deleting a mediafile)
                                // this way we can do something once ALL of the selected mediafiles have been deleted
                                deleteArr.push( mf.mfdelete() );
                            }
                        });
                        // do things that need to wait until ALL deferreds are done
                        $.when.apply($, deleteArr).done(function () {
                            dfd.resolve();
                        });
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
        // hide select boxes from vids and photos
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
                // create a summary video
                else if( self.create_summary_vid_mode_on() ) {
                    return system.defer( function( dfd ) {
                        self.create_video_summary( dfd );
                    }).promise().done( function( response ) {
                        self.clean_up_after_select_mode();
                    }).fail( function() {
                        self.cancel_select_mode();
                    });
                }
            }
            
        } else if ( self.delete_mode_on() ) {
            return system.defer( function( dfd ) {
                self.handle_delete( dfd );
            }).promise().done( function() {
                // handle the pager
                var page;
                // if the user is on the last page then send in the current page minus one as the page to use for the filterSearch
                if( Number(self.thePager().current_page) == Number(self.thePager().last_page) ) {
                    // if there are still photos on the current last page
                    if( Number(self.videos().length) % Number(self.thePager().entries_per_page) != 0 ) {
                        page = Number(self.thePager().current_page);
                    } else {
                        page = Number(self.thePager().current_page-1);
                    }
                }
                // else use the current page
                else {
                    page = Number(self.thePager().current_page);
                }
                self.filterVidsSearchPage( page, true, null );
                
                // clean up
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
            //self.albumFilterIsActive( false );
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
        //self.recentUploadsIsActive(false);
        //self.dateFilterIsActive(false);
        self.selectedMonth('');
        //self.faceFilterIsActive(false);
        self.selectedFace('');
        //self.allVidsIsSelected(false);
        //self.cityFilterIsActive(false);
        self.selectedCity('');
        //self.albumFilterIsActive(false);
        self.selectedFilterAlbum('');
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
            // add the "Location not set" option
            var noLoc = {
                label: "Location not set",
                selected: ko.observable( false )
            };
            self.citiesLabels.push( noLoc );
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
                    _album.label = viblio.unescapeHtml( album.title );
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
                    hp.albumList().getAllAlbumsLabels( self.activeFilterType() == 'album' ? self.currentAlbumAid() : null ).then( function() {
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
                if( self.activeFilterType() == 'album' ) {
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
            //self.selectedVideos.removeAll();
        }
        // for photo mode
        else {
            self.photos().forEach( function( photo ) {
                photo.unselect();
            });
            //self.selectedPhotos.removeAll();
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
        
        if( self.activeFilterType() == 'dates' ) {
            return self.selectedMonth();
        } else if( self.activeFilterType() == 'faces' ) {
            return self.selectedFace().contact_name;
        } else if( self.activeFilterType() == 'cities' ) {
            return self.selectedCity();
        } else if( self.activeFilterType() == 'album' ) {
            return self.selectedFilterAlbum();
        } else if( self.activeFilterType() == 'search') {
            return self.searchQuery();
        } else if( self.activeFilterType() == 'recent' ) {
            return 'Recent Uploads';
        } else if( self.activeFilterType() == 'all' ) {
            return "New Album"
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
    
    newHome.prototype.create_video_summary = function( dfd ) {
        var self = this;
        
        if( self.selectedPhotos().length > 0 ) {
            var args = {
                'images[]': self.selectedPhotos(),
                'summary_type' : 'moments',
                'title': self.getAlbumName() + ' Summary Video',
                'summary_options': {
                    'duration_method': 'shortest'
                }
            };
            
            var json = {
                url: 'services/mediafile/create_video_summary',
                type: "POST",
                data: ko.toJSON(args),
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            };
            
            jQuery.ajax( json ).done( function( response ) {
                // log event in mixpanel
                viblio.mpEvent( 'made_summary' );
                dialog.showModal( 'viewmodels/summaryVidSuccessModal' ).then( function() {
                    viblio.api('services/mediafile/list_status').then( function( data ) {
                        self.numVidsPending( data.stats.pending );
                        var num = data.stats.pending/* + data.stats.visible*/;
                        self.vidsInProcess( num );
                        if( self.vidsInProcess() > 0 ) {
                            // go to recent vids filter
                            self.getRecentVids( true );
                            // go to video mode
                            self.video_mode_on( true );
                            // scroll to the top of the page
                            $("body,html,document").scrollTop(0);
                        }
                    });
                    dfd.resolve( response );    
                });
            }).fail( function() {
                dfd.reject();
            });
        } else {
            dfd.reject();
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
        var maxPos = 49; //height of header
        
        var scrollTop = $(window).scrollTop(),
        elementOffset = $('.toolbar').offset().top,
        distance      = (elementOffset - scrollTop);
        
        if ( $(window).width() >= 900 ) {
            if( distance <= maxPos ){
                $('.toolbar').addClass('stuck');            
            }
            if ( $('.allVidsPage').offset().top - scrollTop >= maxPos ) {
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
        var self = this;
	//$(window).scroll( this, this.scrollHandler );
        //$(window).scroll( this, this.stickyDates );
        $(window).scroll( this, this.stickyToolbars );
        $(window).resize( this, this.getWindowWidth );
        $(window).on( 'resize.mymethod', function() {
            self.setTitleMargin(); 
        });
        //$(window).resize( this, this.stickyDates );
        $(window).resize( this, this.resizePlayer );
    };

    newHome.prototype.detached = function() {
        var self = this;
	//$(window).off( "scroll", this.scollHandler );
        //$(window).off( "scroll", this.stickyDates );
        $(window).off( "scroll", this.stickyToolbars );
        $(window).off( "resize", this.getWindowWidth );
        $(window).off("resize.mymethod");
        //$(window).off( "resize", this.stickyDates );
        $(window).off( "resize", this.resizePlayer );
        $(self.element).find('.paginationContainer').pagination('destroy');
    };
    
    newHome.prototype.activate = function() {
	var self = this;
        self.videos.removeAll();
        
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
        
        if( self.showSearchResults() ){
            self.searchQuery( self.searchResultToShow() );
            self.newVidsSearch();
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
        $.fancybox.reposition();
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
                backgroundGradient: 'none',
                backgroundColor:'rgba(249, 249, 249,1)'
            }
        }).flowplayer().ipad({simulateiDevice: self.should_simulate()});
        var api = flowplayer();
        api.onLoad( function() {
            // just to make sure the fancybox is in the right spot, fire this here
            $('.fancybox-nav').height( $("#player").height()-30 );
            $.fancybox.reposition();
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
                buttons	: {},
                overlay : {
                    locked : true
                }
            },
            tpl: {
              // wrap template with custom inner DIV: the empty player container
              wrap: '<div class="fancybox-wrap" tabIndex="-1">' +
                    '<div class="fancybox-skin">' +
                    '<div class="fancybox-outer"><div class="fancyboxVidLoader centered"><div class="fancyboxVidLoader-Inner"><i class="fa fa-spinner fa-spin fa-5x active"></i><p class="font18">Loading...</p></div></div>' +
                    '<div class="fancyboxVidError fancyboxVidLoader-Inner centered font18"> :( Sorry, this video is private.</div>' +
                    '<div id="player">' + // player container replaces fancybox-inner
                    '</div></div></div></div>' 
            },
            
            beforeShow: function () {
                //$("body").css({'overflow-y':'hidden'});
                if( head.mobile ) {
                    this.helpers.buttons = {position: 'bottom'};
                }
                
                var F = $.fancybox;
                var el, href, api, dl, dl_link;
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
                // handle download link - now added to all videos
                dl_link = self.playingVid().media().views.main.download_url ? self.playingVid().media().views.main.download_url : null;
                dl = "<div class='vidDownloadLink-Wrap pull-right hideOnMobile'><a class='vidDownloadLink' title='Download This Video' href='"+ dl_link +"'><i class='fa fa-2x fa-cloud-download'></i></a></div>"
                this.title = "<span>"+self.playingVid().title()+"</span>"+dl+el;
                
                // fire this here to avoid flickering as the flowplayer/fancybox try to size themselves. Now it's all down before
                // anything is shown.
                self.resizePlayer();
                
                var arr = [];
                self.videos().forEach( function(vid){
                    if( vid != self.playingVid() ) {
                        arr.push( vid.media().uuid );
                    }
                });
                PlayerPage.relatedVids( arr );
                
                $('.fancyboxVidError').hide();
                $('.fancyboxVidLoader').show();
                var errorCallback = function() {
                    // having a callback prevents the default error notification from being shown
                };
                return viblio.api( api, { mid: self.playingVidUUID()  }, errorCallback )
                    .then( function( json ) {
                        var mf = json.media;
                        $('.fancyboxVidLoader').hide();
                        self.setUpFlowplayer( '#player', mf );
                    })
                    .fail( function() {
                        $('.fancyboxVidLoader').hide();
                        $('.fancyboxVidError').show();
                    });
            },
            
            afterLoad: function(current, previous) {
                // When prev and next buttons are clicked, play the correct movie
                self.playingVidIndex( current.index );
                self.playingVid( self.videos()[self.playingVidIndex()] );
                self.playingVidUUID( self.videos()[self.playingVidIndex()].media().uuid );
                
                //$('.fancybox-outer').height( ($("#player").width()*9) / 16 );
            },
            
            beforeClose: function () {
                // important! unload the player
                if(flowplayer()){
                    flowplayer().unload();
                }
            },
            
            afterClose: function(){
                //$("body").css({'overflow-y':'visible'});
            }
        });
        
        // photo viewer
        $('.photoGallery').magnificPopup({
            delegate: '.photo:not(".hidden") .pointer a', // child items selector, by clicking on it popup will open - by including .photo:not(".hidden") only visible photos will be included in the gallery 
            type: 'image',
            gallery: {enabled:true}
        });
        
        // set up pagination
        $('.paginationContainer').pagination({
            //items: self.thePager().total_entries,
            //itemsOnPage: Number(self.thePager().entries_per_page),
            displayedPages: 3,
            edges: 1,
            hrefTextPrefix: '',
            cssStyle: 'light-theme',
            selectOnClick: false,
            onPageClick: function(pageNumber, event){
                if( event && event.type == 'click' ) {
                    event.preventDefault();
                    self.filterVidsSearchPage(pageNumber, null, true);
                }
            }
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
