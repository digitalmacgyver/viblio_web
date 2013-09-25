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

define( ['lib/viblio', 'durandal/app', 'durandal/system', 'viewmodels/mediafile','durandal/events'], function(viblio,app,system,Mediafile,Events) {
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
	return system.defer( function( dfd ) {
	    if ( self.pager.next_page ) {
		viblio.api( '/services/mediafile/list', 
			    { 
			      page: self.pager.next_page, 
			      rows: self.pager.entries_per_page } )
		    .then( function( json ) {
			self.pager = json.pager;
			json.media.forEach( function( mf ) {
			    if ( mf.views.main.location == 's3' || mf.views.main.location == 'us' ) {
				self.addMediaFile( mf );
			    }
			});
			dfd.resolve();
		    });
	    }
	    else {
		dfd.resolve();
	    }
	}).promise();
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
	var scroller = $(self.element).find(".media-container");
	var item = scroller.find('#'+m.media().uuid);
	scroller.scrollTop( item.position().top + scroller.scrollTop() );
    };
    
    // In attached, attach the mCustomScrollbar we're presently
    // employing for this purpose.
    Strip.prototype.compositionComplete = function( view ) {
	var self = this;
	self.element = view;
        
	// Set up a scroll() handler for infinite scroll
	$(self.element).find(".media-container").scroll( function() {
	    var $this = $(this);
            var height = this.scrollHeight - $this.height(); // Get the height of the div
            var scroll = $this.scrollTop(); // Get the vertical scroll position

            var isScrolledToEnd = (scroll >= height);

            if (isScrolledToEnd) {
		self.search();
            }
	});

	// At this point (and only at this point!) we have an accurate
	// height dimension for the scroll area and its item container.
	// If the item container is shorter than the scroller, and there
	// is more data on the server, then fetch more data.  We either
	// want enough data to enable the scrollbar, or all the data
	//
	var scroller_height = $(self.element).find(".media-container").height();
	var container_height = $(self.element).find(".media-container-inner").height();
        
            if ( container_height < scroller_height ) {
	    if ( self.pager.next_page ) {
		var rows = self.pager.entries_per_page;
		// There is more data on the server and we have room to display it.
		// Will fetching 'rows' cover what we need, or do we need to do multiple
		// fetches?
		var item_height = Math.ceil( container_height / rows ); // each item height
		var total_rows  = Math.ceil( scroller_height / item_height );
		var need_rows = (total_rows - rows) + 1; // this is how many more we need to fetch
		var fetches = Math.ceil( need_rows / rows ); // how many search()s
		// This code *should* queue up N searches to run in serial.
		for( var i=0; i<fetches; i++ )
		    $('body').queue(function() {
			self.search().then( function() {
			    $('body').dequeue();
			});
		    });
            }   
	}
    };

    return Strip;
});
