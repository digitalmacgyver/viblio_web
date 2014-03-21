define(['plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/mediafile', 'durandal/events'], function (router, app, system, viblio, Mediafile, events) {

    var HScroll = function( title, subtitle, options ) {
	var self = this;

	// The view element, used to manipulate the scroller mostly
	self.view = null;

	// Passed in title and subtitle
	self.title = ko.observable(title);
	self.subtitle = ko.observable(subtitle || '&nbsp;' );
	self.advanced = options.advanced;
	self.search_api = options.search_api;
        self.desendingOrder = options.descending;

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
	    $(self.view).find( ".sd-scroll").trigger( 'children-changed' );
	});

	// after the initial fetch of data, this is set to true.  Used in the 
	// view to determine when to display UI for no data.
	self.fetched = ko.observable( false );
        
        events.includeIn(HScroll);
    };
    
    HScroll.prototype.getApp = function( media ) {
        router.navigate( 'getApp?from=hscroll' );
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
	    router.navigate( 'new_player?mid=' + m.media().uuid );
	});

	m.on( 'mediafile:composed', function() {
	    $(self.view).find( ".sd-scroll").trigger( 'children-changed', { enable: true } );
	});

	// When a mediafile wishes to be deleted
	//
	m.on( 'mediafile:delete', function( m ) {
	    viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
		self.mediafiles.remove( m );
		$(self.view).find( ".sd-scroll").trigger( 'children-changed' );
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
	$(self.view).find( ".sd-scroll").smoothDivScroll("pause");

            return viblio.api( api, args )
                .then( function( json ) {
                    if ( self.pager.next_page ) {
                        self.pager = json.pager;
                        json.media.forEach( function( mf ) {
                            if ( self.desendingOrder ) {
                                if ( mf.view_count > 0 ) {
                                        self.mediafiles.push( self.addMediaFile( mf ) );
                                    }
                            } else {
                                self.mediafiles.push( self.addMediaFile( mf ) );
                            }		    
                        });

                        if ( self.desendingOrder ) {
                            //reverse the order of the sorted array
                            self.mediafiles.reverse(self.mediafiles.sort( function(l, r) {
                                return Number(l.media().view_count) < Number(r.media().view_count) ? -1 : 1;
                            }));
                        }
                  }
            });    
    };

    HScroll.prototype.compositionComplete = function() {
	var self = this;
	self.search().then( function() { self.fetched( true ); } );
    };

    // Used in the hscroller binding when it hits then end.  Go fetch
    // more data...
    HScroll.prototype.hLimitReached = function() {
	var self = this;
	if ( self.pager.next_page ) {
	    self.search();
	}
	else {
	    // Since we hacked the widget to remove flicker,
	    // we need to manually hide the right most arrow when
	    // we hit the end.
	    $(this.view).find( ".sd-scroll").smoothDivScroll("nomoredata");
        }
    },

    HScroll.prototype.attached = function( view ) {
	var self = this;
	self.view = view;
    };
    
    return HScroll;
});
