define( ['durandal/plugins/router', 'lib/viblio', 'durandal/app', 'viewmodels/mediafile'], function(router,viblio,app,Mediafile) {
    var Strip = function( title, subtitle ) {
	this.element = null;
	this.title = ko.observable(title);
	this.subtitle = ko.observable(subtitle || '&nbsp;' );
	this.mediafiles = ko.observableArray([]);

	this.currentSelection = null;
	this.editLabel = ko.observable( 'Edit' );
    };

    Strip.prototype.mediaSelected = function( media ) {
	if ( this.currentSelection ) {
	    if ( this.currentSelection != media ) {
		this.currentSelection.selected( false );
	    }
	}
	this.currentSelection = media;
    };

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

	m.on( 'mediafile:play', function( m ) {
	    console.log( 'hstrip: play: ' + m.media().uuid );
	    router.navigateTo( '#/player?mid=' + m.media().uuid );
	});

	// Add it to the list
	self.mediafiles.push( m );
    };

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

    Strip.prototype.search = function() {
	var self = this;

	viblio.api( '/services/user/media', function( json ) {
	    json.media.forEach( function( mf ) {
		if ( mf.views.main.location == 's3' || mf.views.main.location == 'us' ) {
		    self.addMediaFile( mf );
		}
	    });
	});

	return this;
    };

    Strip.prototype.viewAttached = function( view ) {
	var self = this;
	self.element = view;
	
	if ( true ) { // might need to change to false to debug in chrome tools
            $(self.element).find(".media-area").mCustomScrollbar({
		contentTouchScroll: true,
		mouseWheel: true,
		theme: 'dark-thick',
		mouseWheel: true,
		autoHideScrollbar: true,
		mouseWheelPixels: 'auto',
		horizontalScroll: true,
		scrollButtons: {
		    enable: true,
		    scrollType: 'continuous',
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
		    updateOnContentResize: true,
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
