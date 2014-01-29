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
    var Album = function( data, options ) {
        var self = this;
        
	this.options = $.extend({
            animated: true, // cycle through videos in album on mouse over
	    ro: false,
	    show_share_badge: false,
	    share_action: 'modal', // 'modal' to popup showShareVidModal, 'trigger' to trigger mediafile:share, function as a callback
	    show_preview: true,    // show animated gif, if available, on hover.
            show_delete_mode: false
	}, options );
        
	this.media    = ko.observable( data );
	this.selected = ko.observable( false );
	this.edittable = ko.observable( false );
	this.ro       = ko.observable( this.options.ro );  // If true, then cannot edit title
	this.show_share_badge = ko.observable( this.options.show_share_badge );
        this.show_delete_mode = ko.observable( this.options.show_delete_mode );
        if( !data.title || data.title == '' ) {
            data.title = 'Click to add album title';
        }
	this.albumTitle = ko.observable( data.title );
	this.description = ko.observable( data.description );
        this.albumViews = ko.observable();
	this.image = ko.observable( this.media().views.poster.url );
        
        this.albumPosterUri = this.media().views.poster.uri.slice( 0, this.media().views.poster.uri.indexOf('/') );
        this.posterTitle = ko.observable();
        // Get title and view count of poster image
        this.media().media.forEach( function( media ){
            console.log(media);
            if( media.uuid == self.albumPosterUri ) {
                self.albumPosterTitle = media.title;
                self.albumPosterViews = media.view_count;
            }
        });
        this.albumLength = this.media().media.length;
        this.videoOrVideos = ko.computed(function() {
            if( self.albumLength == 1 ) {
                return 'Video';
            } else {
                return 'Videos';
            }
        });

	Events.includeIn( this );

	// This will be triggered by a save on the liveEdit custom
	// binding.
	this.on( 'album:name_changed', function( album ) {
            //viblio.log( album );
            if ( album.uuid && this.albumTitle() ) {
                viblio.api( '/services/album/change_title', { aid: album.uuid, title: this.albumTitle() } );
            }
        });
        
        // Once the album is composed and has a view, add mouse-over
        // callbacks that cycle through the media posters that belong to
        // this album. This can be turned off in the options, but is on by default.
        if( this.options.animated == true ) {
            this.on( 'album:composed', function() {
                self.change_title( self.albumPosterTitle );
                self.change_viewCount( self.albumPosterViews );
                $(this.view).find('.mediafile').on( 'mouseover', function() {
                    if ( ! this.i_timer ) {
                        var count = 0;
                        self.change_poster( self.media().media[count].views.poster.url );
                        self.change_title( self.media().media[count].title );
                        self.change_viewCount( self.media().media[count].view_count );
                        count += 1;
                        if ( count >= self.media().media.length )
                            count = 0;
                        this.i_timer = setInterval( function() {
                            self.change_poster( self.media().media[count].views.poster.url );
                            self.change_title( self.media().media[count].title );
                            self.change_viewCount( self.media().media[count].view_count );
                            count += 1;
                            if ( count >= self.media().media.length )
                                count = 0;
                        }, 1000 );
                    }
                });
                $(this.view).find('.mediafile').on( 'mouseleave', function() {
                    clearInterval( this.i_timer ); this.i_timer = 0;
                    self.reset_poster();
                    self.change_title( self.albumPosterTitle );
                    self.change_viewCount( self.albumPosterViews );
                });
            });
        }

    };

    Album.prototype.highlight = function() {
	$(this.view).addClass( 'selected' );
    };

    Album.prototype.unhighlight = function() {
	$(this.view).removeClass( 'selected' );
    };

    // Toggle selected state and send an event.
    Album.prototype.select = function() {
	this.selected( this.selected() ? false : true );
	this.trigger( 'album:selected', this );
    };

    // User clicked on play(), send an event.
    Album.prototype.play = function() {
	this.trigger( 'album:view', this );
    };

    // User clicked on delete(), send an event
    Album.prototype.mfdelete = function() {
	this.trigger( 'album:delete', this );
    };

    Album.prototype.share = function() {
	if ( typeof this.options.share_action == 'function' )
	    this.options.share_action( this );
	else if ( this.options.share_action == 'modal' )
	    dialogs.showShareVidModal( this );
	else if ( this.options.share_action == 'trigger' )
	    this.trigger( 'album:share', this );
    };
    
    Album.prototype.toggleEditMode = function() {
	this.edittable( this.edittable() ? false : true );
	if ( this.show_share_badge() )
	    $(this.view).find( '.media-share-badge' ).toggleClass( 'hideme' );
        $(this.view).find( '.dbtn' ).animate({padding: [ "toggle", "swing" ], width: [ "toggle", "swing" ]}, 300);
    };

    // Send an event, so those above can manage screen
    // redraws, if needed.
    Album.prototype.attached = function( view ) {
	this.view = view;
	this.trigger( 'album:attached', this );
    };

    Album.prototype.compositionComplete = function( view ) {
	var self = this;
	self.view = view;
	self.trigger( 'album:composed', self );
        
        if ( self.options.show_delete_mode ) {
            $( '.media-share-badge' ).addClass( 'hideme' );
            $( '.dbtn' ).show();
        }
    };

    Album.prototype.change_poster = function( url ) {
	this.image( url );
    };

    Album.prototype.reset_poster = function() {
	this.image( this.media().views.poster.url );
    };
    
    Album.prototype.change_title = function( newTitle ) {
	this.posterTitle( newTitle );
    };
    
    Album.prototype.change_viewCount = function( newCount ) {
	this.albumViews( newCount );
    };
    
    return Album;
});
