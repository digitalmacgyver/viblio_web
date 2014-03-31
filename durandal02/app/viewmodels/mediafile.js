/*
  The main mediafile view/model.  Represents a mediafile from the
  server.  Returns an instance factory.
*/
define(['durandal/app', 'durandal/events', 'lib/viblio', 'lib/customDialogs'],function(app, Events, viblio, dialogs) {

    // Temporary.  Used to create random numbers to use for
    // number of video views, ratings, etc.  For GUI development
    // before the backend features are available.
    //
    function randomFromInterval(from,to) {
        return Math.floor(Math.random()*(to-from+1)+from);
    }

    // Constructor takes a mediafile json object from the
    // server and wraps it up as an observable.  Typical
    // access from a model or view is:
    //   m.media().views.main.url
    //
    var Video = function( data, options ) {
	//data.title = data.filename;
	//data.description = 'no description',
	data.eyes = data.view_count || 0;

	this.options = $.extend({
	    ro: false,
	    show_share_badge: false,
	    share_action: 'modal', // 'modal' to popup showShareVidModal, 'trigger' to trigger mediafile:share, function as a callback
	    show_preview: true,    // show animated gif, if available, on hover.
            show_delete_mode: false,
            delete_title: 'delete'
	}, options );
        
	this.media    = ko.observable( data );
	this.selected = ko.observable( false );
	this.edittable = ko.observable( false );
	this.ro       = ko.observable( this.options.ro );  // If true, then cannot edit title
	this.show_share_badge = ko.observable( this.options.show_share_badge );
        this.show_delete_mode = ko.observable( this.options.show_delete_mode );

	this.tags = ko.observableArray( data.tags );

	this.title = ko.observable( data.title );
	this.description = ko.observable( data.description );

	this.image = ko.observable( this.media().views.poster.url );

	Events.includeIn( this );

	// This will be triggered by a save on the liveEdit custom
	// binding.
	var self = this;
	this.on( "mediaFile:TitleDescChanged", function( data ) {
	    viblio.api( '/services/mediafile/set_title_description',
			{ mid: self.media().uuid,
			  title: self.title(),
			  description: self.description()
			}).then( function() {
			    viblio.mpEvent( 'title_description_changed' );
			});
	});

    };

    Video.prototype.highlight = function() {
	$(this.view).addClass( 'selected' );
    };

    Video.prototype.unhighlight = function() {
	$(this.view).removeClass( 'selected' );
    };

    // Toggle selected state and send an event.
    Video.prototype.select = function() {
	this.selected( this.selected() ? false : true );
	this.trigger( 'mediafile:selected', this );
    };

    // User clicked on play(), send an event.
    Video.prototype.play = function() {
	this.trigger( 'mediafile:play', this );
    };

    // User clicked on delete(), send an event
    Video.prototype.mfdelete = function() {
	this.trigger( 'mediafile:delete', this );
    };

    Video.prototype.share = function() {
	if ( typeof this.options.share_action == 'function' )
	    this.options.share_action( this );
	else if ( this.options.share_action == 'modal' )
	    dialogs.showShareVidModal( this );
	else if ( this.options.share_action == 'trigger' )
	    this.trigger( 'mediafile:share', this );
    };
    
    Video.prototype.toggleEditMode = function() {
	this.edittable( this.edittable() ? false : true );
	if ( this.show_share_badge() )
	    $(this.view).find( '.media-share-badge' ).toggleClass( 'hideme' );
        $(this.view).find( '.dbtn' ).animate({padding: [ "toggle", "swing" ], width: [ "toggle", "swing" ]}, 300);
    };

    // Send an event, so those above can manage screen
    // redraws, if needed.
    Video.prototype.attached = function( view ) {
	this.view = view;
	this.trigger( 'mediafile:attached', this );
    };

    Video.prototype.compositionComplete = function( view ) {
	var self = this;
	self.view = view;
	self.trigger( 'mediafile:composed', self );

	if ( self.options.show_preview ) {
	    if ( self.media().views.poster_animated.url ) {
		$(view).on( 'mouseover', function() {
		    self.image( self.media().views.poster_animated.url );
		});

		$(view).on( 'mouseleave', function() {
		    self.image( self.media().views.poster.url );
		});
	    }
	}
        
        if ( self.options.show_delete_mode ) {
            $( '.media-share-badge' ).addClass( 'hideme' );
            $( '.dbtn' ).show();
        }
    };
    
    return Video;
});
