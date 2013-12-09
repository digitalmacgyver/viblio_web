define(['durandal/events','plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/person', 'lib/customDialogs'], function (Events, router, app, system, viblio, Face, dialogs) {

    var Pscroll = function( title, subtitle ) {
	var self = this;

	// The view element, used to manipulate the scroller mostly
	self.view = null;

	// When the scroller has been initialize
	self.scroller_ready = false;

	// Passed in title and subtitle
	self.title = ko.observable(title);
	self.subtitle = ko.observable(subtitle || '&nbsp;' );

	// List of face view/models to manage
	self.faces = ko.observableArray([]);

	// Currently selected face (if we use)
	self.currentSelection = null;

        // Hold the pager data back from server
        // face queries.  Initialize it here so
        // the first fetch works.
        self.pager = {
            next_page: 1,
            entries_per_page: 50,
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
	if ( this.currentSelection ) {
	    if ( this.currentSelection != face ) {
		this.currentSelection.selected( false );
	    }
	}
	this.currentSelection = face;
    };

    Pscroll.prototype.no_select = function() {
	if ( this.currentSelection )
	    $(this.currentSelection.view).removeClass( 'selected' );
    };

    // Add a face file to the collection.  The input
    // is a face json object returned from the server.
    Pscroll.prototype.addFace = function( mf ) {
	var self = this;

	// Create a new Face with the data from the server
	var m = new Face( mf, {
	    show_name: true,
	    clickable: true,
	    click: function( person ) {
		var pos = $(person.view).offset().left + Math.round( $(person.view).width() / 2 );
		if ( self.currentSelection && self.currentSelection != person )
		    $(self.currentSelection.view).removeClass( 'selected' );
		self.faceSelected( person, pos );
	    }
	});

        m.on( 'person:mouseover', function() {
            $(m.view).addClass( 'selected' );
        });

        m.on( 'person:mouseleave', function() {
            if ( m != self.currentSelection )
                $(m.view).removeClass( 'selected' );
        });

        m.on( 'face:composed', function() {
            if ( self.scroller_ready ) {
                $(self.view).smoothDivScroll("recalculateScrollableArea");
                $(self.view).smoothDivScroll("enable");
            }
        });

	return m;
    };

    // This is how the strip is populated.
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

    Pscroll.prototype.ready = function( parent ) {
	var self = this;
        
        // This causes the widget to initialize, since it was originally
	// designed to initialize on page load.
	$(self.view).trigger( 'initialize' );
	
    };

    Pscroll.prototype.detached = function() {
	$(this.view).smoothDivScroll("destroy");
	this.scroller_ready = false;
    };

    return Pscroll;
});
