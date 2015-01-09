define( ['plugins/router',
         'lib/viblio',
         'viewmodels/mediafile',
         'durandal/app',
         'durandal/events',
         'durandal/system',
         'lib/customDialogs',
         'lib/config',
         'viewmodels/hp'], 
    
    function( router,viblio, Mediafile, app, Events, system, dialog, config, hp ) {
        
        var albumList = function( args ) {
            var self = this;
            
            self.view;
            
            self.albumsFilterLabels = ko.observableArray([]);
            // base this value on the value of the name variable in the newHome viewmodel
            // newHome is accessed through the homepage (hp)'s instance of newHome (nhome())
            self.albumFilterIsActive = ko.computed( function(){
                if( hp.nhome().activeFilterType() == 'album' ) {
                    return true;
                } else {
                    return false;
                }
            });
            
            self.albumFilterIsActive.subscribe( function(newVal) {
                if( newVal == false ) {
                    self.albumsFilterLabels().forEach( function( c ) {
                        c.selected( false );
                    });
                }
            });
            
            self.isActiveFlag = ko.computed( function(){
                if( hp.nhome().isActiveFlag() ) {
                    return true;
                } else {
                    return false;
                }
            });
            
            self.showBlockout = ko.observable( false );
            app.on( 'select_mode:on', function() {
                self.showBlockout( true );
            });
            app.on( 'select_mode:off', function() {
                self.showBlockout( false );
            });
            // this will remove an album that has been unshared with the user from the self.albumsFilterLabels() array
            app.on( 'album:delete_shared_album', function( data ) {
                var album;
                if( viblio.findMatch( data.aid, 'uuid', self.albumsFilterLabels() ) != 'Error' ) {
                    album = viblio.findMatch( data.aid, 'uuid', self.albumsFilterLabels() );
                    self.albumsFilterLabels.remove( album );
                }
            });
            
            // this will add a new album to the user's list when another user shares an album
            app.on( 'album:new_shared_album', function( data ) {
                $.when( self.getAllAlbumsLabels() ).then( function() {
                    if( self.albumFilterIsActive() && hp.nhome().currentAlbumAid() != null ) {
                        self.highlightActiveAlbum( hp.nhome().currentAlbumAid() );
                    }    
                });
            });
            
            Events.includeIn( self );
        };
        
        albumList.prototype.unselectAllAlbums = function() {
            var self = this;
            
            self.albumsFilterLabels().forEach( function( c ) {
                c.selected( false );
            });
        };
        
        albumList.prototype.highlightActiveAlbum = function( aid ) {
            var self = this;
            self.albumsFilterLabels().forEach( function( c ) {
                if( c.uuid == aid ) {
                    c.selected( true );
                }
            });
        };
        
        albumList.prototype.getAllAlbumsLabels = function( aid ) {
            var self = this;
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
                    self.albumsFilterLabels( arr );
                    
                    dfd.resolve();
                });    
            }).promise().then( function() {
                if( self.albumsFilterLabels().length > 0 ) {
                    app.trigger( 'albumList:visibility', true );
                } else {
                    app.trigger( 'albumList:visibility', false );
                }
                // if an aid is passed in then highlight the album
                if( aid ) {
                    self.highlightActiveAlbum( aid );
                }
            });
        };
        
        // This function relies on the album filter logic already in place in the newHome viewmodel. That viewmodel
        // is accessed through the hp viewmodel which in turn calls in a new instance of newHome (called nhome in the hp viewmodel)
        albumList.prototype.albumFilterSelected = function( $parent, album ) {
            var self = this;
            
            var gettingAlbum;
            
            if( !$parent.isActiveFlag() ) {
                if( hp.nhome().select_mode_on() ){
                    hp.nhome().cancel_select_mode();
                }

                if( !gettingAlbum ) {
                    gettingAlbum = true;
                    if( album.selected() ) {
                        album.selected(false);
                        hp.nhome().currentAlbumAid(null);
                        hp.nhome().currentAlbumTitle(null);
                        $.when( hp.nhome().showAllVideos() ).then( function() {
                            gettingAlbum = false;
                        });
                    } else {
                        $parent.albumsFilterLabels().forEach( function( c ) {
                            c.selected( false );
                        });
                        album.selected( true );
                        hp.nhome().selectedFilterAlbum( album.label );
                        hp.nhome().currentSelectedFilterAlbum( album );
                        hp.nhome().currentAlbumAid( album.uuid );
                        hp.nhome().currentAlbumTitle( album.title );
                        $.when( hp.nhome().albumVidsSearch( true ) ).then( function() {
                            gettingAlbum = false;
                        });
                    }
                }
            }
        };
        
        albumList.prototype.compositionComplete = function( _view ) {
            var self = this;
            self.view = _view;
            
            $.when( self.getAllAlbumsLabels() ).then( function() {
                app.trigger( 'albumList:composed', self );
            });
        };
        
        return albumList;
});