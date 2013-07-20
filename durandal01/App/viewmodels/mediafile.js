define(['durandal/app','lib/config','lib/viblio'],function(app,config,viblio) {

    var video = function( data ) {
	this.media = data;
	this.selected = ko.observable( false );
	this.view = null;
    };

    video.prototype.select = function(event) {
	var self = event.data;
	viblio.debug( 'media file selected: ' + self.media.uuid );
	self.selected( self.selected() ? false : true );
    };

    video.prototype.enterEditMode = function() {
	$(this.view).find( ".mplay-icon" ).hide();
        $(this.view).find( ".media-file").on( 'click', this, this.select );
    };

    video.prototype.exitEditMode = function() {
	$(this.view).find( ".mplay-icon" ).show();
        this.selected( false );
        $(this.view).find( ".media-file").off( 'click', this, this.select );
    };

    video.prototype.viewAttached = function( view ) {
	this.view = view;
	viblio.debug( 'in after render: ' + this.media.uuid );
    };

    return video;
});
