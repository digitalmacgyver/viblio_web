define(['lib/viblio',
        'viewmodels/mediafile',
        'durandal/app'],
    function(viblio,Mediafile,app) {

    var mediafiles = ko.observableArray([]);
    var searching;
    var play_callback;
    var view;
    var ro = false;
    var passedInVids;
    var user = viblio.user;
    
    var mid;

    function addMediaFile( mf ) {
        // Create a new Mediafile with the data from the server
        var m;
        if( mf.owner_uuid != user().uuid ) {
            console.log("shared style!", mf);
            m = new Mediafile( mf, { shared_style: true, ro: true } )
        } else {
            m = new Mediafile( mf, { ro: ro } )
        }

        // Proxy the mediafile play event and send it along to
        // our parent.
        m.on( 'mediafile:play', function( m ) {
	    play_callback( m );
        });

        // Add it to the list
        mediafiles.push( m );
    };

    return {
        mediafiles: mediafiles,
        passedInVids: passedInVids,
        
	init: function( elem, _mediafiles, relatedList, playingVid, pp, _searching, _play_callback, _ro ) {
	    var self = this;

	    view = elem;
	    mediafiles( _mediafiles );
            passedInVids = relatedList, 
	    searching = _searching;
	    play_callback = _play_callback;
	    ro = _ro;
            
            self.reset();
            if( relatedList().length == 0 ) {
                self.search( playingVid().media().uuid, {},
                function(){
                    pp.resizePlayer;
                    pp.playRelated( self.mediafiles()()[0] );
                    self.mediafiles()()[0].selected( true );
                });
            } else {
                self.search( playingVid().media().uuid, { related: relatedList() },
                function(){
                    pp.resizePlayer;
                    pp.playRelated( self.mediafiles()()[0] );
                    self.mediafiles()()[0].selected( true );
                });
            }
	},

	reset: function() {
	    mediafiles().removeAll();
	},
        
        search: function( _mid, options, callback ) {
            if ( _mid ) mid = _mid;
	    var args =  { 
                mid: mid,
                'media[]': options.related
            };
            searching( true );
            viblio.api( '/services/mediafile/related', args )  
                .then( function( json ) {
                    json.media.forEach( function( mf ) {
                        addMediaFile( mf );
                    });
                    searching( false );
                    if( callback ) {
                        callback();
                    }
                });          
	},

	isClipAvailable: function( idx ) {
            if( passedInVids().length == 0 ){
                return( idx >= 0 && idx < mediafiles()().length );
            } else {
                if( mediafiles()().length < 1 ) {
                    return false;    
                } else {
                    return( idx >= 0 && idx < mediafiles()().length );
                }
            }	    
	},

	scrollTo: function( m ) {
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
