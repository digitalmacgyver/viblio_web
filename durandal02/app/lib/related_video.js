define(['lib/viblio','viewmodels/mediafile','durandal/app'], function(viblio,Mediafile,app) {

    var mediafiles = ko.observableArray([]);
    var searching;
    var play_callback;
    var view;
    var ro = false;
    var passedInVids;

    var mid;

    /*var criterion = {
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
    /*};*/

    function addMediaFile( mf ) {
        // Create a new Mediafile with the data from the server
        var m = new Mediafile( mf, { ro: ro } );

        // Proxy the mediafile play event and send it along to
        // our parent.
        m.on( 'mediafile:play', function( m ) {
	    play_callback( m );
        });

        // Add it to the list
        mediafiles.push( m );
    };

    return {
	//criterion: criterion,
        mediafiles: mediafiles,
        passedInVids: passedInVids,
        
	init: function( elem, _mediafiles, relatedList, playingVid, _searching, _play_callback, _ro ) {
	    var self = this;

	    view = elem;
	    mediafiles( _mediafiles );
            passedInVids = relatedList, 
	    searching = _searching;
	    play_callback = _play_callback;
	    ro = _ro;
            
            console.log( relatedList());
            if( relatedList().length > 0 ){
                mediafiles().removeAll();
                //mediafiles( relatedList() );
                console.log( playingVid() );
                relatedList().forEach( function( vid ) {
                    if( vid.media().uuid != playingVid().media().uuid ) {
                        addMediaFile( vid.media() );
                    }
                })
            }
            
            /*if( passedInVids().length == 0 ){
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
            }*/
	    // If its a mobile device, add a little surger
	    if ( head.mobile ) 
		$(elem).kinetic();
            
            console.log( 'from related', passedInVids() );
            if( passedInVids().length == 0 ){
                this.reset();
            }   
	},

	reset: function() {
	    mediafiles.removeAll();
	    //pager.next_page = 1;
	    //pager.total_entries = -1;
	},

	/*search: function( _mid, options, callback ) {
            console.log('search is being called');
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
                        callback();
                    });
            }
	},*/
        
        search: function( _mid, options, callback ) {
            console.log('search is being called');
	    
            if ( _mid ) mid = _mid;
	    var args =  { mid: mid };
            searching( true );
            viblio.api( '/services/mediafile/related', args )  
                .then( function( json ) {
                    console.log( json );
                    //pager = json.pager;
                    json.media.forEach( function( mf ) {
                        addMediaFile( mf );
                    });
                    searching( false );
                    //callback();
                });          
	},

	isClipAvailable: function( idx ) {
            console.log( idx, passedInVids().length, mediafiles()().length );
            if( passedInVids().length == 0 ){
                /*if ( pager.total_entries == -1 )
                    return false*/
                return( idx >= 0 && idx < mediafiles()().length );
            } else {
                if( mediafiles()().length < 1 ) {
                    return false;    
                } else {
                    console.log( idx >= 0 && idx < mediafiles.length );
                    return( idx >= 0 && idx < mediafiles()().length );
                }
            }	    
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
