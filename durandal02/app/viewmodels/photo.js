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
    var Photo = function( data, options ) {
	//data.title = data.filename;
	//data.description = 'no description',
        
        var self = this;

	self.options = $.extend({
            shared_style: false, // if mf is shared with user show different style
            show_select_badge: false,
            selected: false,
            ownedByViewer: false,
            owner_uuid: ko.observable(null),
            hidden: ko.observable( true )
	}, options );
        
	self.media    = ko.observable( data );
	self.selected = ko.observable( self.options.selected );
        self.hidden = ko.observable( self.options.hidden );
        self.hasBeenShown = ko.observable( false );
	self.edittable = ko.observable( false );
        self.shared_style = ko.observable( self.options.shared_style );
        self.gift_style = ko.computed( function() {
            if( data.is_viblio_created == 1 ) {
                return true;
            } else {
                return false;
            }
        });
        self.owner_avatar = "/services/na/avatar?uid=" + data.owner_uuid + "&y=40";
        self.owner_name = ko.computed( function(){
            if( data.owner ) {
                return data.owner.displayname;
            }
        });
        self.show_select_badge = ko.observable( self.options.show_select_badge );
        
        self.winWidth = ko.observable( $(window).width() );
        self.image = ko.observable( self.media().url );
        
        self.filter = ko.observable( data.filter );
        
        self.download_url = ko.observable( data.download_url );

	Events.includeIn( self );

    };
    
    Photo.prototype.highlight = function() {
	$(this.view).addClass( 'selected' );
    };

    Photo.prototype.unhighlight = function() {
	$(this.view).removeClass( 'selected' );
    };
    
    Photo.prototype.showIt = function() {
	this.hidden( false );
        //this.hasBeenShown( true );
    };
    
    Photo.prototype.hideIt = function() {
	this.hidden( true );
    };

    // Toggle selected state to on and send an event.
    Photo.prototype.select = function() {
	this.selected( true );
        this.trigger( 'photo:selected', this );
    };
    
    // Toggle selected state to off and send an event.
    Photo.prototype.unselect = function() {
	this.selected( false );
        this.trigger( 'photo:unselected', this );
    };

    // User clicked on play(), send an event.
    Photo.prototype.play = function() {
	this.trigger( 'photo:play', this );
    };

    // User clicked on delete(), send an event
    Photo.prototype.pdelete = function() {
	this.trigger( 'photo:delete', this );
    };

    Photo.prototype.mfOwnedByViewer = function( mf ) {
        var uuid;
        if( mf.owner_uuid ){
            uuid = mf.owner_uuid;
        } else if( mf.media().owner_uuid ){
            uuid = mf.media().owner_uuid;
        }
        
        if( uuid === viblio.user().uuid ){
            return true;
        } else {
            return false;
        } 
    };
    
    Photo.prototype.turnOnSelectMode = function() {
        this.show_select_badge( true );
    };
    
    Photo.prototype.turnOffSelectMode = function() {
        this.show_select_badge( false );
    };

    // Send an event, so those above can manage screen
    // redraws, if needed.
    Photo.prototype.attached = function( view ) {
	this.view = view;
	this.trigger( 'photo:attached', this );
    };
    
    Photo.prototype.detached = function( view ) {
        console.log( "photo is being removed" );
        //ko.removeNode(view); 
    };

    Photo.prototype.compositionComplete = function( view ) {
	var self = this;
	self.view = view;
	self.trigger( 'photo:composed', self );
        if ( self.options.shared_style ) {
            $(view).hover(
                function () {
                  $(view).find('.sharedOwnerWrap').stop(true, true).animate({ 'bottom': '0' }, 'fast');
                }, 
                function () {
                  $(view).find('.sharedOwnerWrap').stop(true, true).animate({ 'bottom': '-60px' }, 'fast');
                }
            );
        }
        
        // this will trigger the number of faces to show to be correct when resizing window
        //$( window ).bind('resize', function(){ self.winWidth( $( window ).width() );} );
    };
    
    return Photo;
});
