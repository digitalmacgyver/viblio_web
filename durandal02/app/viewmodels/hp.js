define(['durandal/app',
        "plugins/router",
	"lib/viblio",
        "lib/customDialogs",
        "viewmodels/newHome",
        'viewmodels/shell'],
    
    function(app,router,viblio,customDialogs,newHome,shell){
        
    var view;
    var albumList = ko.observable();
    var albumListResolved = $.Deferred();
    var albumList_is_visible = false;
    var coverphoto;
    var firstTime = ko.observable();
    var showPhotos = ko.observable(null);
    
    var nhome = ko.observable();
    
    var showFaces = ko.observable(true);
   
    // Used to handle message from email to open upload modal
    var user = viblio.user;
    var loggedIn = ko.computed(function(){
        if( user() && user().uuid != null ) {
            return true;
        } else {
            return false;
        }
    });
    
    var goToAlbum = ko.observable( null );
    
    app.on( 'albumList:composed', function( obj ) {
	albumList(obj);
        albumListResolved.resolve();
    });
    
    app.on( 'coverphoto:composed', function( obj ) {
        coverphoto = obj;
        handle_visibility( albumList() );
    });
    
    // Shown after first video upload is completed.
    this.on( 'nginxModal:closed', function() {
	customDialogs.showModal( 'viewmodels/firstTimeUploadModal' ); 
    });
    
    function toggleTopStrip() {
        if( showFaces() ) {
            showFaces( false );
        } else {
            showFaces( true );
            if( coverphoto ) {
                coverphoto.handleBackstretch();
            }
        }
    }
    
    function findMatch( find, inArray ) {
        var match = ko.utils.arrayFirst( inArray, function( a ) {
            return a.uuid === find;
        });
        if (match) {
            return match;  
        } else {
            return 'Error';
        }    
    };
    
    // 
    function activateAlbum( aid ) {
        $.when(albumListResolved).then(function() {
            // the album exists and is found in the albumList
            if( findMatch( aid, albumList().albumsFilterLabels() ) != 'Error' ) {
                var album = findMatch( aid, albumList().albumsFilterLabels() );
                nhome().selectedFilterAlbum( album.label );
                nhome().currentSelectedFilterAlbum( album );
                nhome().currentAlbumAid( album.uuid );
                nhome().currentAlbumTitle( album.title.toUpperCase() );
                $.when( nhome().albumVidsSearch( true ) ).then( function(){
                    albumList().highlightActiveAlbum( aid );
                });
                
                //this strips the aid params off of the url after navigation
                router.navigate('#home', { trigger: false, replace: true });                  
            }
            // The album does not exist - either a private or nonexistant album -
            // run the search function anyway and let the errorCallback handle the error that will
            // come back from the server
            else {
                nhome().currentAlbumAid( goToAlbum );
                nhome().albumVidsSearch( true );
            }
        });
    };
    
    function handle_visibility( visible ) {
	albumList_is_visible = visible;
        var albumsWidth;
	if ( visible ) {
            albumsWidth = $(view).find('.albumListView').width();
	    $(view).find( '.top-strip .cont' ).css( 'margin-right', -albumsWidth );
	    $(view).find( '.top-strip .right' ).css( 'display', 'block' );

	    //$(view).find( '.top-strip .cont .left' ).animate({ 'margin-right': '340px' });
	    $(view).find( '.top-strip .cont .left' ).css('margin-right', albumsWidth);
	}
	else {
	    $(view).find( '.top-strip .right' ).css( 'display', 'none' );

	    $(view).find( '.top-strip .cont' ).css( 'margin-right', '0px' );
	    $(view).find( '.top-strip .cont .left' ).css( 'margin-right', '0px' );
	}
    }
    
    app.on( 'albumList:visibility', function( visible ) {
	handle_visibility( visible );
    });
    
    function showFirstTimeBubble() {
        customDialogs.showModal( 'viewmodels/firstTimeUserModal' );
    };

    return{
        nhome: nhome,
        albumList: albumList,
        
        showFaces: showFaces,
        
        toggleTopStrip: toggleTopStrip,
        
        shell: shell,
        
        activate: function( args ) {
            
            // if photos=true then we will want to show the photos view once newHome has been created
            if( args && args.photos ) {
                showPhotos( args.photos );
            } else {
                showPhotos( null );
            }
            
            if( args ){
                // this cleans up to avoid an extra call to activate when the nhome observable is updated
                var videos = $('#videos')[0];
                if( videos ) {
                    ko.cleanNode(videos);
                }
                
                if( args.aid ) {
                    nhome( new newHome( {aid: args.aid} ) );
                    goToAlbum(args.aid);
                } else if( args.fid ) {
                    nhome( new newHome( {fid: args.fid} ) );  
                } else if( args.addAlbum ) {
                    nhome( new newHome( {addAlbum: true} ) );
                }  else if( args.recent ) {
                    nhome( new newHome( {recent: true} ) );
                } else if( args.addVideos ) {
                    nhome( new newHome() );
                    // When user is routed from email link for 'upload' capture that and open upload modal on login
                    var last_URL = router.activeInstruction().config.route + "?" + router.activeInstruction().queryString;
                    if ( loggedIn() ) {
                        customDialogs.showModal( 'viewmodels/nginx-modal' );
                    } else {
                        // Set the last attempt to a function that will route the user to the home page and will open the add vids modal
                        viblio.setLastAttempt( function() {
                            router.navigate( last_URL );
                            setTimeout( function(){
                                customDialogs.showModal( 'viewmodels/nginx-modal' );
                            },1000);
                            viblio.setLastAttempt( null );
                        });
                        customDialogs.showModal( 'viewmodels/loginModal', 'Please log in before uploading new videos to your account.' );
                    }
                } else if( args.search ) {
                    nhome( new newHome( {search: args.search} ) );
                } else {
                    nhome( new newHome() );
                }             
            } else {
                // this cleans up to avoid an extra call to activate when the nhome observable is updated
                var videos = $('#videos')[0];
                if( videos ) {
                    ko.cleanNode(videos);
                }
                goToAlbum( null );
                nhome( new newHome() );
            }
                       
            // Used for testing only - remove after testing is complete
            //localStorage.clear();
            
            // check if this is user's first visit
            viblio.localStorage( 'hasUserBeenHereBefore' ).then(function( data ) {
                if ( data ) {
                    firstTime( false );
                } else {
                    firstTime( true );
                    showFirstTimeBubble();
                    viblio.localStorage( 'hasUserBeenHereBefore', true );
                }
            });
        },
        
	compositionComplete: function( _view ) {
	    view = _view;
            if( goToAlbum() ) {
                activateAlbum( goToAlbum() );
            }
	    handle_visibility( albumList_is_visible );
            
            // this will switch to the photos view when newHome is created and will put it in the specified mode
            // For example if ?photos=all then photo mode will be turned on and the photo filter will be set to show all photos
            if( showPhotos() ) {
                nhome().video_mode_on( false );
                nhome().photoViewFilter( showPhotos() );
            }
	}
    };
});
