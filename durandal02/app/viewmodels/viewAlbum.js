define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/mediafile', 'viewmodels/hscroll', 'viewmodels/yir', 'lib/customDialogs', 'viewmodels/allVideos', ], function (router, app, system, viblio, Mediafile, HScroll, YIR, customDialogs, allVideos) {

    var strips = ko.observableArray([]);
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
    var boxOfficeHits = ko.observableArray();
    var allVids = ko.observableArray();
    
    var mediaHasViews = ko.observable( false );
    
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
    
    function addMediaFile( mf ) {
	var self = this;

	// Create a new Mediafile with the data from the server
	var m = new Mediafile( mf, { show_share_badge: true } );

	// Register a callback for when a Mediafile is selected.
	// This is so we can deselect the previous one to create
	// a radio behavior.
	m.on( 'mediafile:selected',  function( sel ) {
	    self.mediaSelected( sel );
	});

	// Play a mediafile clip.  This uses the query parameter
	// passing technique to pass in the mediafile to play.
	m.on( 'mediafile:play', function( m ) {
	    router.navigate( 'new_player?mid=' + m.media().uuid );
	});

	m.on( 'mediafile:composed', function() {
	    $( ".horizontal-scroller").trigger( 'children-changed', { enable: true } );
	});

	// When a mediafile wishes to be deleted
	//
	m.on( 'mediafile:delete', function( m ) {
	    viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
		self.mediafiles.remove( m );
		$( ".horizontal-scroller").trigger( 'children-changed' );
	    });
	});

	return m;
    };
    
    return {
        showShareVidModal: function() {
	    app.showMessage( 'Need a custom dialog for sharing this page.' );
        },
        albumTitle: albumTitle,
        strips: strips,
        displayName: 'Album',        
	ownerPhoto: ownerPhoto,
	ownerName: ownerName,
        ownedByViewer: ownedByViewer,
        boxOfficeHits: boxOfficeHits,
        allVids: allVids,
        mediaHasViews: mediaHasViews,
        
        title: 'Box Office Hits',
        subtitle: 'The most popular videos in this album',
        
        activate: function (args) {
            system.log(args, viblio.user().uuid);
	    var self = this;
	    album_id = args.aid;
	    strips.removeAll();
            boxOfficeHits.removeAll();
            allVids.removeAll();
            viblio.mpEvent( 'album viewed' );
	    return system.defer( function( dfd ) {
		viblio.api( 'services/album/get?aid=' + album_id ).then( function( data ) {
                    viblio.log(data);
		    var album = data.album;
                    //ownerName( album.owner.name );
                    //ownerUUID( album.owner.uuid );
                    album.media.forEach( function( mf ) {
                        if( mf.view_count > 0 ) {
                            mediaHasViews( true );
                            boxOfficeHits.push( addMediaFile( mf ) );
                        }
                        allVids.push( addMediaFile( mf ) );
                    });
                    
                    //reverse the order of the sorted array
                    boxOfficeHits.reverse(boxOfficeHits.sort( function(l, r) {
                        return Number(l.media().view_count) < Number(r.media().view_count) ? -1 : 1;
                    }));
		    
                    albumTitle( album.title );
                    dfd.resolve();
		    /*$.when( hh('Box Office Hits', 'The most popular videos in this album', 
			       { search_api: function() {
				   return( { api: '/services/faces/media_face_appears_in', args: { album_uuid: album_id } } );
			       }}), 
			    yy( album_id ),
                            av( album_id )
			 ).then( function( h1, h2, h3 ) {
			     self.hits = h1;
			     self.yir  = h2;
			     strips.push( h1 );
			     strips.push( h2 );
                             //self.strips.push( h3 );
			     dfd.resolve();
			 });*/
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
