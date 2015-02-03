define( ['plugins/router',
         'lib/viblio',
         'viewmodels/mediafile',
         'durandal/app',
         'durandal/events',
         'durandal/system',
         'lib/customDialogs',
         'lib/config',
         'viewmodels/hp',
         'plugins/dialog'], 
    
    function( router,viblio, Mediafile, app, Events, system, customDialogs, config, hp, dialog ) {
        
        var albumListModal = function( args ) {
            var self = this;
            
            self.albumsFilterLabels = ko.observableArray([]);
            self.selectedAlbum = ko.observable(null);
            self.gettingList = ko.observable(false);
        };
        
        albumListModal.prototype.close = function() {
            var self = this;
            
            dialog.close( self );
	};
        
        albumListModal.prototype.done = function() {
            var self = this;
            
            dialog.close( self, self.selectedAlbum() );
	};
        
        albumListModal.prototype.unselectAllAlbums = function() {
            var self = this;
            
            self.albumsFilterLabels().forEach( function( c ) {
                c.selected( false );
            });
        };
        
        albumListModal.prototype.highlightActiveAlbum = function( aid ) {
            var self = this;
            console.log( 'highlightActiveAlbum fired', aid );
            self.albumsFilterLabels().forEach( function( c ) {
                if( c.uuid == aid ) {
                    c.selected( true );
                }
            });
        };
        
        albumListModal.prototype.getAllAlbumsLabels = function() {
            var self = this;
            self.albumsFilterLabels.removeAll();
            self.gettingList( true );
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
                    self.albumsFilterLabels( arr );
                    dfd.resolve();
                });    
            }).promise().then( function() {
                self.gettingList( false );
                if( self.albumsFilterLabels().length > 0 ) {
                    // todo - show a dialog saying there are no albums 
                }
            });
        };
        
        albumListModal.prototype.albumFilterSelected = function( $parent, album ) {
            if( album.selected() ) {
                album.selected(false);
                $parent.selectedAlbum( null );
            } else {
                $parent.albumsFilterLabels().forEach( function( c ) {
                    c.selected( false );
                });
                album.selected( true );
                $parent.selectedAlbum( album );
            }
        };
        
        albumListModal.prototype.activate = function() {
            var self = this;
            
            self.getAllAlbumsLabels();
        };
        
        albumListModal.prototype.compositionComplete = function() {
            app.trigger( 'albumListModal:composed', this );
        };
        
        return albumListModal;
});