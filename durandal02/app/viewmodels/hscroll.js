define(['plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/mediafile', 'durandal/events'], function (router, app, system, viblio, Mediafile, events) {

    var HScroll = function( title, subtitle, options ) {
	var self = this;

	// The view element, used to manipulate the scroller mostly
	self.view = null;

	// When the scroller has been initialize
	self.scroller_ready = false;

	// Passed in title and subtitle
	self.title = ko.observable(title);
	self.subtitle = ko.observable(subtitle || '&nbsp;' );
	self.advanced = options.advanced;
	self.search_api = options.search_api;

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
            entries_per_page: 15,
            total_entries: -1 /* currently unknown */
        };

	// When new mediafiles arrive in the system async, add them
	// to the start of the list.
	app.on( 'mediafile:ready', function( mf ) {
	    var m = self.addMediaFile( mf );
	    self.mediafiles.unshift( m );
	    if ( self.scroller_ready ) 
		$(self.view).smoothDivScroll("recalculateScrollableArea");
	});
        
        events.includeIn(HScroll);
    };
    
    HScroll.prototype.getApp = function( media ) {
        router.navigate( 'getApp?from=hscroll' );
    }
    
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
	    router.navigate( 'new_player?mid=' + m.media().uuid );
	});

	m.on( 'mediafile:composed', function() {
	    if ( self.scroller_ready ) {
		$(self.view).smoothDivScroll("recalculateScrollableArea");
		$(self.view).smoothDivScroll("enable");
	    }
	});

	// When a mediafile wishes to be deleted
	//
	m.on( 'mediafile:delete', function( m ) {
	    viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
		self.mediafiles.remove( m );
		$(self.view).smoothDivScroll("recalculateScrollableArea");
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
	var api = '/services/mediafile/list';
	var args = { views: ['poster'],
		     page: self.pager.next_page, 
		     rows: self.pager.entries_per_page };
	if ( self.search_api ) {
	    var proto = self.search_api();
	    api = proto.api;
	    args = $.extend( args, proto.args ); 
	}

	// pause is needed to temporarily turn off the timers that control
	// hover and mousedown scrolling, while we go off and fetch data
	// it will be re-enabled in mediafile:composed at the proper time
	$(self.view).smoothDivScroll("pause");

	return viblio.api( api, args )
	    .then( function( json ) {
		self.pager = json.pager;
		json.media.forEach( function( mf ) {
		    self.mediafiles.push( self.addMediaFile( mf ) );
		});
	    });
    };

    HScroll.prototype.activate = function() {
	var self = this;
	return self.search();
    };

    HScroll.prototype.attached = function( view ) {
	var self = this;
	self.view = $(view).find(".sd-scroll");
        
        $(self.view).smoothDivScroll({
            scrollingHotSpotLeftClass: "mCSB_buttonLeft",
            scrollingHotSpotRightClass: "mCSB_buttonRight",
	    hotSpotScrolling: true,
	    visibleHotSpotBackgrounds: 'always',
	    setupComplete: function() {
		self.scroller_ready = true;
	    },
	    scrollerRightLimitReached: function() {
		if ( self.pager.next_page ) {
		    self.search();
		}
		else {
		    // Since we hacked the widget to remove flicker,
		    // we need to manually hide the right most arrow when
		    // we hit the end.
		    $(self.view).smoothDivScroll("nomoredata");
                    }
		}
	});
    };

    HScroll.prototype.ready = function( parent ) {
	var self = this;
	
	// This causes the widget to initialize, since it was originally
	// designed to initialize on page load.
	$(self.view).trigger( 'initialize' );
    };

    HScroll.prototype.detached = function() {
	$(this.view).smoothDivScroll("destroy");
	this.scroller_ready = false;
    };

    return HScroll;
});
