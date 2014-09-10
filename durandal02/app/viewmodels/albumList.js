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
            
            self.albumsFilterLabels = ko.observableArray([]);
            // base this value on the value of the name variable in the newHome viewmodel
            // newHome is accessed through the homepage (hp)'s instance of newHome (nhome())
            self.albumFilterIsActive = ko.computed( function(){
                if( hp.nhome().albumFilterIsActive() ) {
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
            
            /*app.on( 'album:name_changed', function() {
                self.getAllAlbumsLabels();
            });*/
        };
        
        albumList.prototype.unselectAllAlbums = function() {
            var self = this;
            
            self.albumsFilterLabels().forEach( function( c ) {
                c.selected( false );
            });
        };
        
        albumList.prototype.highlightActiveAlbum = function( aid ) {
            var self = this;
            console.log( 'highlightActiveAlbum fired', aid );
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
            
            console.log( 'albumList albumFilterSelected fired', album);
            
            var gettingAlbum;
        
            // Used to close the dropdown
            //$("body").trigger("click");
            
            if( hp.nhome().select_mode_on() ){
                hp.nhome().cancel_select_mode();
            }
            
            if( !gettingAlbum ) {
                gettingAlbum = true;
                if( album.selected() ) {
                    album.selected(false);
                    hp.nhome().currentAlbumAid(null);
                    hp.nhome().currentAlbumTitle(null);
                    hp.nhome().showAllVideos();
                    gettingAlbum = false;
                } else {
                    $parent.albumsFilterLabels().forEach( function( c ) {
                        c.selected( false );
                    });
                    album.selected( true );
                    hp.nhome().selectedFilterAlbum( album.label );
                    hp.nhome().currentSelectedFilterAlbum( album );
                    hp.nhome().currentAlbumAid( album.uuid );
                    hp.nhome().currentAlbumTitle( album.title.toUpperCase() );
                    hp.nhome().albumVidsSearch( true );
                    gettingAlbum = false;
                }
            } else {
                return;
            }
        };
        
        albumList.prototype.activate = function() {
            var self = this;
            
            self.getAllAlbumsLabels();
            //self.albumFilterIsActive( hp.nhome().albumFilterIsActive() );
        };
        
        albumList.prototype.compositionComplete = function() {
            app.trigger( 'albumList:composed', this );
        };
        
        return albumList;
});