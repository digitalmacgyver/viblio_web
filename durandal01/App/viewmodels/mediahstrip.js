/*
  Horizontal scrollable strip of media files.  Used currently on the
  channels page.  Has a title and subtile, represent a search by some
  criterion for media.  The scroller is currently mCustomScrollbar which
  has some nice features.
*/
define( ['plugins/router', 'lib/viblio', 'durandal/app', 'viewmodels/mediafile'], function(router,viblio,app,Mediafile) {
    var Strip = function( title, subtitle ) {
	var self = this;

	// The view element, used to manipulate the scroller mostly
	this.element = null;

	// Passed in title and subtitle
	this.title = ko.observable(title);
	this.subtitle = ko.observable(subtitle || '&nbsp;' );

	// Will eventually pass in a query, somehow

	// List of mediafile view/models to manage
	this.mediafiles = ko.observableArray([]);

	// Currently selected mediafile (if we use)
	this.currentSelection = null;

	// An edit/done label to use on the GUI
	this.editLabel = ko.observable( 'Edit' );

        // Hold the pager data back from server
        // media queries.  Initialize it here so
        // the first fetch works.
        this.pager = {
            next_page: 1,
            entries_per_page: 12,
            total_entries: -1 /* currently unknown */
        };

	// When new mediafiles arrive in the system async, add them
	// to the start of the list.
	app.on( 'mediafile:ready', function( mf ) {
	    var m = new Mediafile( mf );
	    self.mediafiles.unshift( m );
	    setTimeout( function() {
		$(self.element).find(".media-area").mCustomScrollbar("update");
	    },100);
	});

    };

    // We may not use selection in the GUI, but if we do,
    // this managed a radio-selection behavior.
    Strip.prototype.mediaSelected = function( media ) {
	if ( this.currentSelection ) {
	    if ( this.currentSelection != media ) {
		this.currentSelection.selected( false );
	    }
	}
	this.currentSelection = media;
    };

    // Add a media file to the collection.  The input
    // is a mediafile json object returned from the server.
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

	// Play a mediafile clip.  This uses the query parameter
	// passing technique to pass in the mediafile to play.
	m.on( 'mediafile:play', function( m ) {
	    router.navigate( '#/player?mid=' + m.media().uuid );
	});

	// When a mediafile wishes to be deleted
	//
	m.on( 'mediafile:delete', function( m ) {
	    viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
		self.mediafiles.remove( m );
		$(self.element).find(".media-area").mCustomScrollbar("update");
	    });
	});

	// Add it to the list
	self.mediafiles.push( m );
    };

    // Toggle edit mode.  This will put all of media
    // files in the strip into/out of edit mode.  I'm thinking
    // this will be the way user's can delete their media files
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
		mouseWheelPixels: 400,
		horizontalScroll: true,
		scrollButtons: {
		    enable: true,
		    scrollType: 'continous',
		    scrollSpeed: 'auto'
		},
		callbacks: {
		    onTotalScrollOffset: ( 2 * 260 ), // The width of 2 pics
		    onTotalScroll: function() {
			console.log( 'SCROLLED TO END: ' + mcs.left );
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
