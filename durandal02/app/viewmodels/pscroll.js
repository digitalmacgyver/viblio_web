define(['durandal/events','plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/face', 'lib/customDialogs'], function (Events, router, app, system, viblio, Face, dialogs) {

    var Pscroll = function( title, subtitle ) {
	var self = this;

	// The view element, used to manipulate the scroller mostly
	self.view = null;

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
	    if ( self.view ) 
		$(self.view).mCustomScrollbar("update");
	});

	// When a face wishes to be deleted
	//
	m.on( 'face:delete', function( m ) {
	    viblio.api( '/services/faces/delete', { uuid: m.face().uuid } ).then( function() {
		self.faces.remove( m );
		$(self.view).mCustomScrollbar("update");
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
	self.view = $(view).find(".pscroll");
	$(view).find(".pscroll-cc").mouseover( function(e) {
	    // hover in
	    //if ( self.pager.next_page )
	    $( ".pscroll-cc .fwd" ).css( "visibility", "visible" );
	    if ( self.pos != 0 )
		$( ".pscroll-cc .back" ).css( "visibility", "visible" );
	}).mouseout( function(e) {
	    // hover out
	    $( ".pscroll-cc .fwd" ).css( "visibility", "hidden" );
	    $( ".pscroll-cc .back" ).css( "visibility", "hidden" );
	});
    };

    Pscroll.prototype.ready = function( parent ) {
	var self = this;
	$(self.view).mCustomScrollbar({
	    horizontalScroll: true,
	    scrollInertia: 800,
	    mouseWheel: true,
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
		    }
		},
		onTotalScrollOffset: ( 2 * 250 ),
		onScroll: function() {
		    // Keep track of current position if the mouse wheel/swipe is used
		    self.pos = Math.abs(mcs.left);
		}
	    }
	});
	self.pos = 0;
    };

    // manual scroll 
    Pscroll.prototype.scrollForward = function() {
	var self = this;
	self.pos += 500;
	if ( self.pos > $(".item-container").width() - 500 )
	    self.pos = $(".item-container").width() - 500;
	$(self.view).mCustomScrollbar("scrollTo", self.pos);
    };

    // manual scroll
    Pscroll.prototype.scrollBackward = function() {
	var self = this;
	self.pos -= 500;
	if ( self.pos < 0 ) self.pos = 0;
	$(self.view).mCustomScrollbar("scrollTo", self.pos);
    };

    Pscroll.prototype.action = function( a ) {
	var self = this;
	if ( a == 'removeall' ) {
	    self.items.removeAll();
	    $(self.view).mCustomScrollbar( "update" );
	}
	else if ( a == 'addone' ) {
	    var m = new Face( self.save[ self.idx ] );
	    m.on( 'face:compositionComplete', function() {
		// Have to wait until the face object has composed
		// itself before updating the scrollbar
		$(self.view).mCustomScrollbar( "update" );
	    });
	    self.items.push( m );

	    self.idx = self.idx + 1;
	    if ( self.idx > 10 ) self.idx = 5;
	}
    };

    return Pscroll;
});
