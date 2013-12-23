define( function() {
    var viblio = require( 'lib/viblio' );
    var Mediafile = require( 'viewmodels/mediafile' );
    var mediafiles;
    var searching;
    var play_callback;
    var view;

    var mid;

    criterion = {
        by_date: true,
        by_faces: true,
        by_geo: true,
        geo_unit: 'meter',
        geo_distance: 100
    };

    var pager = {
        next_page: 1,
        entries_per_page: 16,
        total_entries: -1 /* currently unknown */
    };

    function addMediaFile( mf ) {
        // Create a new Mediafile with the data from the server
        var m = new Mediafile( mf );

        // Proxy the mediafile play event and send it along to
        // our parent.
        m.on( 'mediafile:play', function( m ) {
	    play_callback( m );
        });

        // Add it to the list
        mediafiles.push( m );
    };

    return {
	init: function( elem, _mediafiles, _searching, _play_callback ) {
	    view = elem;
	    mediafiles = _mediafiles;
	    searching = _searching;
	    play_callback = _play_callback;
	},

	reset: function() {
	    mediafiles.removeAll();
	    pager.next_page = 1;
	    pager.total_entries = -1;
	},

	search: function( _mid, options ) {
	    if ( _mid ) mid = _mid;
	    var opts = $.extend( criterion, 
				 { mid: mid, 
				   page: pager.next_page, 
				   rows: pager.entries_per_page }, 
				 options );
            if ( pager.next_page ) {
                searching( true );
                //viblio.api( '/services/mediafile/related', opts ) 
                viblio.api( '/services/mediafile/list', opts ) 
                    .then( function( json ) {
                        pager = json.pager;
                        json.media.forEach( function( mf ) {
                            addMediaFile( mf );
                        });
                        searching( false );
                    });
            }
	},

	isClipAvailable: function( idx ) {
	    if ( pager.total_entries == -1 )
		return false
            return( idx >= 0 && idx < pager.total_entries );
	},

	scrollTo: function( m ) {
	},

    };
});
