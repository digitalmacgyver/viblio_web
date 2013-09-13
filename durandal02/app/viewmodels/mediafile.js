/*
  The main mediafile view/model.  Represents a mediafile from the
  server.  Returns an instance factory.
*/
define(['durandal/app', 'durandal/events', 'lib/viblio'],function(app, Events, viblio) {

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
    var Video = function( data ) {
	//data.title = data.filename;
	//data.description = 'no description',
	data.eyes = randomFromInterval( 3, 199 );
        
	this.media    = ko.observable( data );
	this.selected = ko.observable( false );
	this.edittable = ko.observable( false );

	this.title = ko.observable( data.title );
	this.description = ko.observable( data.description );
        
	Events.includeIn( this );

	// This will be triggered by a save on the liveEdit custom
	// binding.
	var self = this;
	this.on( "mediaFile:TitleDescChanged", function( data ) {
	    viblio.api( '/services/mediafile/set_title_description',
			{ mid: self.media().uuid,
			  title: self.title(),
			  description: self.description()
			});
	});

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
    
    // Method usually called from above; toggle
    // the edittable observable.  Will affect the
    // GUI state.
    Video.prototype.toggleEditMode = function() {
	this.edittable( this.edittable() ? false : true );
	if ( this.edittable ) {
	    $(this.view).find( '.dbtn' ).toggle('slide', {direction: 'right'}, 300);
	}
    };

    // Send an event, so those above can manage screen
    // redraws, if needed.
    Video.prototype.attached = function( view ) {
	this.view = view;
	this.trigger( 'mediafile:attached', this );
    };

    Video.prototype.compositionComplete = function( view ) {
	this.view = view;
	this.trigger( 'mediafile:composed', this );
    };
    
    return Video;
});
