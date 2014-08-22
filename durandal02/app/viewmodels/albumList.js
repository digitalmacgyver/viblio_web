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
            // base this value on the value of the name varialbe in the newHome viewmodel
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
            
            app.on( 'album:name_changed', function() {
                self.getAllAlbumsLabels();
            });
        };
        
        albumList.prototype.getAllAlbumsLabels = function() {
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
                app.trigger( 'albumList:visibility', true );
            });
        };
        
        // This fucntion relies on the album filter logic already in place in the newHome viewmodel. That viewmodel
        // is accessed through the hp viewmodel which in turn calls in a new instance of newHome (called nhome in the hp viewmodel)
        albumList.prototype.albumFilterSelected = function( $parent, album ) {
            var self = this;
            
            var gettingAlbum;
        
            // Used to close the dropdown
            $("body").trigger("click");

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