define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/mediafile', 'viewmodels/hscroll', 'viewmodels/yir', 'lib/customDialogs', 'viewmodels/allVideos', ], function (router, app, system, viblio, Mediafile, HScroll, YIR, customDialogs, allVideos) {

    var strips = ko.observableArray([]);
    //var hits, yir;
    var albumTitle = ko.observable();
    var album_id;
    var ownerPhoto = ko.observable();
    var ownerName  = ko.observable();
    var ownerUUID = ko.observable();
    var ownedByViewer = ko.computed(function(){
        if( ownerUUID == viblio.user().uuid ){
            return true;
        } else {
            return false;
        }
    });
    
    function hh(title, subtitle, options) {
        return system.defer( function( dfd ) {
            dfd.resolve( new HScroll(title, subtitle, options) );
        } ).promise();
    }

    function yy( album_id ) {
        return system.defer( function( dfd ) {
            dfd.resolve( new YIR( album_id, albumTitle() ) );
        } ).promise();
    }
    
    function av( album_id ) {
        return system.defer( function( dfd ) {
            dfd.resolve( new allVideos( album_id, albumTitle() ) );
        } ).promise();
    }
    
    return {
        showShareVidModal: function() {
	    app.showMessage( 'Need a custom dialog for sharing this page.' );
        },
        displayName: 'Album',        
	ownerPhoto: ownerPhoto,
	ownerName: ownerName,
        ownedByViewer: ownedByViewer,
        
        activate: function (args) {
            system.log(args, viblio.user().uuid);
	    var self = this;
	    album_id = args.uuid;
	    self.strips.removeAll();
            viblio.mpEvent( 'album viewed' );
	    return system.defer( function( dfd ) {
		viblio.api( '/services/album', { uuid: album_id }).then( function( data ) {
		    var album = data.album;
                    ownerName( album.owner.name );
                    ownerUUID( album.owner.uuid );
		    albumTitle( album.name );
		    $.when( hh('Box Office Hits', 'The most popular videos in this album', 
			       { search_api: function() {
				   return( { api: '/services/faces/media_face_appears_in', args: { album_uuid: album_id } } );
			       }}), 
			    yy( album_id ),
                            av( album_id )
			 ).then( function( h1, h2, h3 ) {
			     self.hits = h1;
			     self.yir  = h2;
			     self.strips.push( h1 );
			     self.strips.push( h2 );
                             //self.strips.push( h3 );
			     dfd.resolve();
			 });
		});
                ownerPhoto( "/services/na/avatar?uid=" + ownerUUID + "&y=66" );
	    }).promise();
        },
	attached: function() {
	    return system.defer( function( dfd ) {
		customDialogs.showLoading();
		dfd.resolve();
	    }).promise();
	},
	compositionComplete: function( view, parent ) {
	    var self = this;
	    system.wait(1).then( function() {
		customDialogs.hideLoading();
	    });
	}
    };
});
