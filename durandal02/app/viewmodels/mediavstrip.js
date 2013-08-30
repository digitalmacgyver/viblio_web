/*
  Vertical scrollable strip of media files.  This ought to be
  reuable.  Current used on the player page.

  Returns an instance factory.  

    var vstrip = new Strip()

  The title and subtitle constructor params are left over from
  the horizontal strip model and are not presently used in this
  gui.  They might be in the future, so they're still here and
  observable.
*/

define( ['lib/viblio', 'durandal/app', 'viewmodels/mediafile','durandal/events'], function(viblio,app,Mediafile,Events) {
    var Strip = function( title, subtitle ) {
	// The element the view is attached to.
	this.element = null;

	// title and subtitle not presently used
	this.title = ko.observable(title);
	this.subtitle = ko.observable(subtitle || '&nbsp;' );

	// array of mediafile view/models to manage
	this.mediafiles = ko.observableArray([]);

	// The currently selected mediafile
	this.currentSelection = null;

	// Edit button label, not presently used
	this.editLabel = ko.observable( 'Edit' );

	// Hold the pager data back from server
	// media queries.  Initialize it here so
	// the first fetch works.
	this.pager = {
	    next_page: 1,
	    entries_per_page: 6,
	    total_entries: -1 /* currently unknown */
	};

	// We send a 'mediavstrip:play' event when
	// we receive a mediafile:play event from
	// one of our children.  The player view
	// triggers on this to play a video in the
	// player.
	Events.includeIn( this );
    };

    // Left over from the mediahstrip, used to provide
    // radio selection behavior.  But we don't use
    // selection (presently) in the vertical strip.
    Strip.prototype.mediaSelected = function( media ) {
	if ( this.currentSelection ) {
	    if ( this.currentSelection != media ) {
		this.currentSelection.selected( false );
	    }
	}
	this.currentSelection = media;
    };

    // Add a new mediafile to our managed list of mediafiles
    //
    Strip.prototype.addMediaFile = function( mf ) {
	var self = this;

	// Create a new Mediafile with the data from the server
	var m = new Mediafile( mf );

	// Register a callback for when a Mediafile is selected.
	// This is so we can deselect the previous one to create
	// a radio behavior.
	m.on( 'mediafile:selected',  function( sel ) {
	    self.mediaSelected( sel );
	});

	// When a new Mediafile is added to the horizontal scroller,
	// we neeed to call its update() method to redraw.
	m.on( 'mediafile:attached', function() {
	    $(self.element).find(".media-area").mCustomScrollbar("update");
	});

	// Proxy the mediafile play event and send it along to
	// our parent.
	m.on( 'mediafile:play', function( m ) {
	    self.trigger( 'mediavstrip:play', m );
	});

	// Add it to the list
	self.mediafiles.push( m );
    };

    // If something like an edit mode is supported.  In the
    // player, it is not.
    Strip.prototype.toggleEditMode = function() {
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
    Strip.prototype.search = function() {
	var self = this;

	if ( self.pager.next_page ) {
	    viblio.api( '/services/mediafile/list', 
			{ page: self.pager.next_page, 
			  rows: self.pager.entries_per_page } )
		.then( function( json ) {
		    self.pager = json.pager;
		    json.media.forEach( function( mf ) {
			if ( mf.views.main.location == 's3' || mf.views.main.location == 'us' ) {
			    self.addMediaFile( mf );
			}
		    });
		});
	}
	// Else I got all media files for this
	// query.

	return this;
    };

    // Can be called from above to see if a particular mediafile
    // index is a legal index into the mediafiles array
    Strip.prototype.isClipAvailable = function( idx ) {
	var self = this;
	if ( self.pager.total_entries == -1 )
	    return false
	return( idx >= 0 && idx < self.pager.total_entries );
    };

    // Scroll to the mediafile specified.
    Strip.prototype.scrollTo = function( m ) {
	var self = this;
	$(self.element).find(".media-area").mCustomScrollbar('scrollTo', '#'+m.media().uuid );
    };

    // In attached, attach the mCustomScrollbar we're presently
    // employing for this purpose.
    Strip.prototype.attached = function( view ) {
	var self = this;
	self.element = view;
	
	if ( true ) { // might need to change to false to debug in chrome tools
            $(self.element).find(".media-area").mCustomScrollbar({
		contentTouchScroll: true,
		theme: 'dark-thick',
		mouseWheel: true,
		autoHideScrollbar: true,
		mouseWheel: true,
		mouseWheelPixels: 300,
		horizontalScroll: false,
		scrollButtons: {
		    enable: true,
		    scrollType: 'continuous',
		    scrollSpeed: 'auto'
		},
		callbacks: {
		    onTotalScrollOffset: ( 2 * 180 ), // The height of 2 pics
		    onTotalScroll: function() {
			// fetch more media files
			self.search();
		    }
		},
		advanced: {
		    // updateOnContentResize: true,
		    updateOnBrowserResize: true
		}

	    });
	}
	
        ko.utils.domNodeDisposal.addDisposeCallback(self.element, function() {
            $(self.element).find(".media-area").mCustomScrollbar("destroy");
        });
    };

    return Strip;
});
