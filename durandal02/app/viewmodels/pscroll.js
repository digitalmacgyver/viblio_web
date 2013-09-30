define(['durandal/events','plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/face', 'lib/customDialogs'], function (Events, router, app, system, viblio, Face, dialogs) {

    var Pscroll = function( title, subtitle ) {
	var self = this;

	// The view element, used to manipulate the scroller mostly
	self.view = null;

	// When the scroller has been initialize
	self.scroller_ready = false;

	// Passed in title and subtitle
	self.title = ko.observable(title);
	self.subtitle = ko.observable(subtitle || '&nbsp;' );

	// Will eventually pass in a query, somehow

	// List of face view/models to manage
	self.faces = ko.observableArray([]);

	// Currently selected face (if we use)
	self.currentSelection = null;

	// An edit/done label to use on the GUI
	self.editLabel = ko.observable( 'Edit' );

        // Hold the pager data back from server
        // face queries.  Initialize it here so
        // the first fetch works.
        self.pager = {
            next_page: 1,
            entries_per_page: 10,
            total_entries: -1 /* currently unknown */
        };

	// When new faces arrive in the system async, add them
	// to the start of the list.
	app.on( 'face:ready', function( mf ) {
	    var m = self.addFace( mf );
	    self.faces.unshift( m );
	    if ( self.scroller_ready ) 
		$(self.view).smoothDivScroll("recalculateScrollableArea");
	});

	Events.includeIn( this );
    };

    // We may not use selection in the GUI, but if we do,
    // this managed a radio-selection behavior.
    Pscroll.prototype.faceSelected = function( face, pos ) {
	this.trigger( 'pscroll:faceSelected', face, pos );
	// dialogs.showMessage( face.name(), 'Selected' );
	if ( this.currentSelection ) {
	    if ( this.currentSelection != face ) {
		this.currentSelection.selected( false );
	    }
	}
	this.currentSelection = face;
    };

    // Add a face file to the collection.  The input
    // is a face json object returned from the server.
    Pscroll.prototype.addFace = function( mf ) {
	var self = this;

	// Create a new Face with the data from the server
	var m = new Face( mf );

	// Register a callback for when a Face is selected.
	// This is so we can deselect the previous one to create
	// a radio behavior.
	m.on( 'face:selected',  function( sel, pos ) {
	    self.faceSelected( sel, pos );
	});

	// Play a face clip.  This uses the query parameter
	// passing technique to pass in the face to play.
	m.on( 'face:play', function( m ) {
	    router.navigate( '#/new_player?mid=' + m.face().uuid );
	});

        m.on( 'face:composed', function() {
            if ( self.scroller_ready ) {
                $(self.view).smoothDivScroll("recalculateScrollableArea");
                $(self.view).smoothDivScroll("enable");
            }
        });

	// When a face wishes to be deleted
	//
	m.on( 'face:delete', function( m ) {
	    viblio.api( '/services/faces/delete', { uuid: m.face().uuid } ).then( function() {
		self.faces.remove( m );
		$(self.view).smoothDivScroll("recalculateScrollableArea");
	    });
	});

	return m;
    };

    // Toggle edit mode.  This will put all of face
    // files in the strip into/out of edit mode.  I'm thinking
    // this will be the way user's can delete their face files
    Pscroll.prototype.toggleEditMode = function() {
	var self = this;
	if ( self.editLabel() == 'Edit' )
	    self.editLabel( 'Done' );
	else
	    self.editLabel( 'Edit' );

	self.faces().forEach( function( mf ) {
	    mf.toggleEditMode();
	});
    };

    // This is how the strip is populated.  This is not
    // very interesting at the moment.  In the future it
    // needs to take some sort of search criterion to
    // restrict the faces displayed.  It also needs
    // to do paging to handle infinite scroll.
    Pscroll.prototype.search = function() {
	var self = this;

        // pause is needed to temporarily turn off the timers that control
        // hover and mousedown scrolling, while we go off and fetch data
        // it will be re-enabled in mediafile:composed at the proper time
        $(self.view).smoothDivScroll("pause");

	return viblio.api( '/services/faces/contacts',
			   { page: self.pager.next_page, 
			     rows: self.pager.entries_per_page } )
	    .then( function( json ) {
		self.pager = json.pager;
		json.faces.forEach( function( mf ) {
		    self.faces.push( self.addFace( mf ) );
		});
	    });
    };

    Pscroll.prototype.activate = function() {
	var self = this;
	return self.search();
    };

    Pscroll.prototype.attached = function( view ) {
	var self = this;
	self.view = $(view).find(".sd-pscroll");
    };

    Pscroll.prototype.ready = function( parent ) {
	var self = this;

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
	// This causes the widget to initialize, since it was originally
	// designed to initialize on page load.
	$(self.view).trigger( 'initialize' );
    };

    return Pscroll;
});
