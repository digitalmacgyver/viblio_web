define(['durandal/events'],function(Events) {
    var Face = function( data ) {
	this.data = data;

	this.url = ko.observable( data.url );
	this.name = ko.observable( data.contact_name ? data.contact_name : 'unknown' );
	this.appears_in = ko.observable( data.appears_in );
	this.star = ko.observable( data.appears_in > 2 );
	this.selected = ko.observable( false );

	Events.includeIn( this );
    };

    Face.prototype.select = function(f, e) {
	var pos = Math.round( e.target.x + (e.target.width/2) );
	this.trigger( 'face:selected', this, pos );
    };

    Face.prototype.attached = function( view ) {
        this.view = view;
        this.trigger( 'face:attached', this );
    };

    Face.prototype.compositionComplete = function( view ) {
        this.view = view;
        this.trigger( 'face:composed', this );
    };
    
    return Face;
});
