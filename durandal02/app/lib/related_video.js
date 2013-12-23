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
	criterion: criterion,
	init: function( elem, _mediafiles, _searching, _play_callback ) {
	    var self = this;

	    view = elem;
	    mediafiles = _mediafiles;
	    searching = _searching;
	    play_callback = _play_callback;

	    $(elem).scroll( $.throttle( 250, function() {
		var $this = $(this);
		var height = this.scrollHeight - $this.height(); // Get the height of the div
		var scroll = $this.scrollTop(); // Get the vertical scroll position

		if ( searching() ) return;
		if ( height == 0 && scroll == 0 ) return;

		var isScrolledToEnd = (scroll >= height);

		if (isScrolledToEnd) {
                    self.search();
		}
            }));

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
                viblio.api( '/services/mediafile/related', opts ) 
                //viblio.api( '/services/mediafile/list', opts ) 
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
	    var self = this;
            var scroller = $(view);
            var item = scroller.find('#'+m.media().uuid);
	    // If its already totally visible, do nothing, else scroll to make it visible

	    var item_top = scroller.scrollTop() + item.position().top;
	    var item_bot = item_top + item.height();

	    var scroller_top = scroller.scrollTop();
	    var scroller_bot = scroller_top + scroller.height();

	    if ( item_top >= scroller_top && item_bot <= scroller_bot ) {
		// do nothing
	    }
	    else {
		scroller.scrollTop( item.position().top + scroller.scrollTop() );
	    }
	},

    };
});
