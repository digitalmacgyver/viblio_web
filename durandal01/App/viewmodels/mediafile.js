define(['durandal/events'],function(Events) {

    function randomFromInterval(from,to) {
        return Math.floor(Math.random()*(to-from+1)+from);
    }

    var video = function( data ) {
	data.title = data.filename;
	data.description = 'no description',
	data.eyes = randomFromInterval( 3, 199 );

	this.media    = ko.observable( data );
	this.selected = ko.observable( false );
	this.edittable = ko.observable( false );

	Events.includeIn( this );
    };

    video.prototype.select = function() {
	this.selected( this.selected() ? false : true );
	this.trigger( 'mediafile:selected', this );
    };

    video.prototype.play = function() {
	this.trigger( 'mediafile:play', this );
    };
    
    video.prototype.toggleEditMode = function() {
	this.edittable( this.edittable() ? false : true );
    };

    video.prototype.viewAttached = function( view ) {
	this.trigger( 'mediafile:attached', this );
    };

    return video;
});
