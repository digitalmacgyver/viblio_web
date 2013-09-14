define(['plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/mediafile'], function (router, app, system, viblio, Mediafile) {

    var HScroll = function( title, subtitle, advanced ) {
	var self = this;

	// The view element, used to manipulate the scroller mostly
	self.view = null;

	// Passed in title and subtitle
	self.title = ko.observable(title);
	self.subtitle = ko.observable(subtitle || '&nbsp;' );
	self.advanced = advanced;

	// Will eventually pass in a query, somehow

	// List of mediafile view/models to manage
	self.mediafiles = ko.observableArray([]);

	// Currently selected mediafile (if we use)
	self.currentSelection = null;

	// An edit/done label to use on the GUI
	self.editLabel = ko.observable( 'Edit' );

        // Hold the pager data back from server
        // media queries.  Initialize it here so
        // the first fetch works.
        self.pager = {
            next_page: 1,
            entries_per_page: 5,
            total_entries: -1 /* currently unknown */
        };

	// When new mediafiles arrive in the system async, add them
	// to the start of the list.
	app.on( 'mediafile:ready', function( mf ) {
	    var m = self.addMediaFile( mf );
	    self.mediafiles.unshift( m );
	});
    };

    // We may not use selection in the GUI, but if we do,
    // this managed a radio-selection behavior.
    HScroll.prototype.mediaSelected = function( media ) {
	if ( this.currentSelection ) {
	    if ( this.currentSelection != media ) {
		this.currentSelection.selected( false );
	    }
	}
	this.currentSelection = media;
    };

    // Add a media file to the collection.  The input
    // is a mediafile json object returned from the server.
    HScroll.prototype.addMediaFile = function( mf ) {
	var self = this;

	// Create a new Mediafile with the data from the server
	var m = new Mediafile( mf );

	// Register a callback for when a Mediafile is selected.
	// This is so we can deselect the previous one to create
	// a radio behavior.
	m.on( 'mediafile:selected',  function( sel ) {
	    self.mediaSelected( sel );
	});

	// Play a mediafile clip.  This uses the query parameter
	// passing technique to pass in the mediafile to play.
	m.on( 'mediafile:play', function( m ) {
	    router.navigate( '#/new_player?mid=' + m.media().uuid );
	});

	m.on( 'mediafile:composed', function() {
	    if ( self.view ) 
		$(self.view).mCustomScrollbar("update");
	});

	// When a mediafile wishes to be deleted
	//
	m.on( 'mediafile:delete', function( m ) {
	    viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
		self.mediafiles.remove( m );
		$(self.view).mCustomScrollbar("update");
	    });
	});

	return m;
    };

    // Toggle edit mode.  This will put all of media
    // files in the strip into/out of edit mode.  I'm thinking
    // this will be the way user's can delete their media files
    HScroll.prototype.toggleEditMode = function() {
	var self = this;
	if ( self.editLabel() == 'Edit' )
	    self.editLabel( 'Done' );
	else
	    self.editLabel( 'Edit' );

	self.mediafiles().forEach( function( mf ) {
	    mf.toggleEditMode();
	});
    };

    // This is how the strip is populated.  This is not
    // very interesting at the moment.  In the future it
    // needs to take some sort of search criterion to
    // restrict the mediafiles displayed.  It also needs
    // to do paging to handle infinite scroll.
    HScroll.prototype.search = function() {
	var self = this;
	return viblio.api( '/services/mediafile/list',
			   { page: self.pager.next_page, 
			     rows: self.pager.entries_per_page } )
	    .then( function( json ) {
		self.pager = json.pager;
		json.media.forEach( function( mf ) {
		    if ( mf.views.main.location == 's3' || mf.views.main.location == 'us' ) {
			self.mediafiles.push( self.addMediaFile( mf ) );
		    }
		});
	    });
    };

    HScroll.prototype.activate = function() {
	var self = this;
	return self.search();
    };

    HScroll.prototype.attached = function( view ) {
	var self = this;
	self.view = $(view).find(".hscroll");
        $( ".hscroll-cc .back" ).hide();
        /*if ( self.pos != 0 ) {
            $( ".hscroll-cc .back" ).fadeIn( 'slow' );
        }
	$(view).find(".hscroll-cc").mouseover( function(e) {
	    // hover in
	    //if ( self.pager.next_page )
	    $( ".hscroll-cc .fwd" ).fadeIn( 'slow' );
	    if ( self.pos != 0 )
		$( ".hscroll-cc .back" ).fadeIn( 'slow' );
	}).mouseout( function(e) {
	    // hover out
	    $( ".hscroll-cc .fwd" ).fadeOut( 'slow' );
	    $( ".hscroll-cc .back" ).fadeOut( 'slow' );
	});*/
    };

    HScroll.prototype.ready = function( parent ) {
	var self = this;
	$(self.view).mCustomScrollbar({
	    horizontalScroll: true,
	    scrollInertia: 800,
	    mouseWheel: false,
	    mouseWheelPixels: 300,
	    autoHideScrollbar: true,
	    scrollButtons: {
		enable: true,
		scrollType: "continuous",
		scrollAmount: 300,
		scrollSpeed: 200
	    },
	    contentTouchScroll: true,
	    advanced: {
		autoExpandHorizontalScroll: true
	    },
	    callbacks: {
		onTotalScroll: function() {
		    if ( self.pager.next_page ) {
			$(self.view).find(".mCSB_dragger_bar").addClass("hscroller-loading" );
			self.search().then(function() {
			    $(self.view).mCustomScrollbar( "update" );
			    $(self.view).find(".mCSB_dragger_bar").removeClass("hscroller-loading" );
			});
		    } else {
                        self.hideIt( $( ".hscroll-cc .fwd" ), 'fast' );
                    }
		},
		//onTotalScrollOffset: ( 2 * 250 ),
		onScroll: function() {
		    // Keep track of current position if the mouse wheel/swipe is used
		    self.pos = Math.abs(mcs.left);
                    console.log(self.pos);
                    if ( self.pos > 0 ) {
                        self.showIt( $( ".hscroll-cc .back" ), 'fast' );
                    } else {
                        self.hideIt( $( ".hscroll-cc .back" ), 'fast' );
                    }
                    if ( self.pos < ( $(".hscroll-cc .item-container").width() ) ) {
                        self.showIt( $( ".hscroll-cc .fwd" ), 'fast' );
                    }
		},
                onTotalScrollBack: function() {
                    self.hideIt( $( ".hscroll-cc .back" ), 'fast' );
                }        
	    }
	});
	self.pos = 0;
        if( $(".hscroll-cc .item-container").width() < $('body').width() ) {
            $( ".hscroll-cc .fwd" ).hide();
        }
    };
    
    HScroll.prototype.hideIt = function( el, speed ) {
        if (!speed) {
            speed = 'slow';
        }
        el.stop(true, true).fadeOut( speed );
    };
    
    HScroll.prototype.showIt = function( el, speed ) {
        if (!speed) {
            speed = 'slow';
        }
        el.stop(true, true).fadeIn( speed );
    };

    // manual scroll 
    HScroll.prototype.scrollForward = function() {
	var self = this;
	self.pos += 500;
	/*if ( self.pos > $(".item-container").width() - 500 ) {
	    self.pos = $(".item-container").width() - 500;
        }
        if ( self.pos != 0 ) {
            this.showIt( $( ".hscroll-cc .back" ) );
        }
        if ( self.pos > ( $(".item-container").width()/2 ) + 500 ) {
            this.hideIt( $( ".hscroll-cc .fwd" ) );
        }*/
	$(self.view).mCustomScrollbar("scrollTo", self.pos);
    };

    // manual scroll
    HScroll.prototype.scrollBackward = function() {
	var self = this;
	self.pos -= 500;
	if ( self.pos < 0 ) {
            self.pos = 0;
        }
        /*if ( self.pos == 0 ) {
            this.hideIt( $( ".hscroll-cc .back" ) );
        }
        if ( self.pos < ( $(".item-container").width()/2 ) + 500 ) {
            this.showIt( $( ".hscroll-cc .fwd" ) );
        }*/
	$(self.view).mCustomScrollbar("scrollTo", self.pos);
    };

    HScroll.prototype.action = function( a ) {
	var self = this;
	if ( a == 'removeall' ) {
	    self.items.removeAll();
	    $(self.view).mCustomScrollbar( "update" );
	}
	else if ( a == 'addone' ) {
	    var m = new Mediafile( self.save[ self.idx ] );
	    m.on( 'mediafile:compositionComplete', function() {
		// Have to wait until the mediafile object has composed
		// itself before updating the scrollbar
		$(self.view).mCustomScrollbar( "update" );
	    });
	    self.items.push( m );

	    self.idx = self.idx + 1;
	    if ( self.idx > 10 ) self.idx = 5;
	}
    };

    return HScroll;
});
