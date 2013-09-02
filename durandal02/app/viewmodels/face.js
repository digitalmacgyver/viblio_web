define(['durandal/events'],function(Events) {
    var Face = function( data ) {
	this.data = data;

	this.url = ko.observable( data.url );
	this.name = ko.observable( data.contact_name ? data.contact_name : 'unknown' );
	this.selected = ko.observable( false );

	Events.includeIn( this );
    };

    Face.prototype.select = function() {
	console.log( 'Selected ' + this.name() );
	this.trigger( 'face:selected', this );
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
