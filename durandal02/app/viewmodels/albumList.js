define( ['plugins/router',
         'lib/viblio',
         'viewmodels/mediafile',
         'durandal/app',
         'durandal/events',
         'durandal/system',
         'lib/customDialogs',
         'lib/config'], 
    
    function( router,viblio, Mediafile, app, Events, system, dialog, config ) {
        
        var albumList = function( args ) {
            var self = this;
            
            var albumLabels = ko.observableArray([]);
        };
        
        albumList.prototype.getAllAlbumsLabels = function() {
            var self = this;
            self.albumLabels.removeAll();
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
                    self.albumLabels( arr );
                    // add the create album option at the top of the list
                    self.albumLabels.unshift( {label: "Create New Album", selected: ko.observable(false)} );
                    
                    dfd.resolve();
                });    
            }).promise();
        };
        
        return albumList;
});