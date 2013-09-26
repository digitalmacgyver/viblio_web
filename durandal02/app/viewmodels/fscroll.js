define(['plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/mediafile'], function (router, app, system, viblio, Mediafile) {

    var FScroll = function( title, subtitle ) {
	var self = this;

	// The view element, used to manipulate the scroller mostly
	self.view = null;

	// Passed in title and subtitle
	self.title = ko.observable(title);
	self.subtitle = ko.observable(subtitle || '&nbsp;' );

	// Used to show and hide this strip
	self.isvisible = ko.observable( false );

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

	self.contact_id = null;
        
        self.showFwd = ko.observable( true );
    };
        
    // We may not use selection in the GUI, but if we do,
    // this managed a radio-selection behavior.
    FScroll.prototype.mediaSelected = function( media ) {
	if ( this.currentSelection ) {
	    if ( this.currentSelection != media ) {
		this.currentSelection.selected( false );
	    }
	}
	this.currentSelection = media;
    };

    // Add a media file to the collection.  The input
    // is a mediafile json object returned from the server.
    FScroll.prototype.addMediaFile = function( mf ) {
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
		$(self.view).smoothDivScroll("recalculateScrollableArea");
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
    FScroll.prototype.toggleEditMode = function() {
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
    FScroll.prototype.search = function( contact_id ) {
	var self = this;
	self.contact_id = contact_id;
	return viblio.api( '/services/faces/media_face_appears_in',
			   { contact_uuid: contact_id,
			     page: self.pager.next_page, 
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

    FScroll.prototype.activate = function() {
	var self = this;
    };

    FScroll.prototype.seeAll = function() {
	router.navigate( '#/videosof?uuid=' + this.contact_id );
    };

    FScroll.prototype.attached = function( view ) {
	var self = this;
	self.view = $(view).find(".sd-fscroll");
	self.arrow = $(view).find(".arrow");
    };

    FScroll.prototype.ready = function( parent ) {
	var self = this;
	$(self.view).smoothDivScroll({
	    hotSpotScrolling: true,
	    visibleHotSpotBackgrounds: 'hover',
	    scrollerRightLimitReached: function() {
		if ( self.pager.next_page ) {
		    // pause is needed to temporarily turn off the timers that control
		    // hover and mousedown scrolling, while we go off and fetch data
		    $(self.view).smoothDivScroll("pause");
		    self.search( self.contact_id ).then( function() {
			// Recalculate the geometry
			$(self.view).smoothDivScroll("recalculateScrollableArea");
			// re-enable (come out of pause)
			$(self.view).smoothDivScroll("enable");
		    });
		}
		else {
		    // Since we hacked the widget to remove flicker,
		    // we need to manually hide the right most arrow when
		    // we hit the end.
		    $(self.view).smoothDivScroll("nomoredata");
		}
	    }
	});
	// This causes the widget to initialize, since it was originally
	// designed to initialize on page load.
	$(self.view).trigger( 'initialize' );
    };

    FScroll.prototype.clear = function() {
	var self = this;
	self.pager = {
            next_page: 1,
            entries_per_page: 5,
            total_entries: -1 /* currently unknown */
        };
	self.mediafiles.removeAll();
	$(self.view).smoothDivScroll("recalculateScrollableArea");
    };

    FScroll.prototype.show = function( pos ) {
	this.isvisible( true );
	pos -= Math.round( $(this.arrow).width() / 2 );
	$(this.arrow).css( 'left', pos+'px' );
    };

    FScroll.prototype.hide = function() {
	this.isvisible( false );
    };

    FScroll.prototype.setTitle = function( title ) {
	this.title( title );
    };
    
    return FScroll;
});
