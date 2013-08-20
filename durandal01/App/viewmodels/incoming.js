/* The incoming video dialog
*/
define( ['plugins/router', 'plugins/dialog'], function(router, dialog) {
    var Incoming = function( messages ) {
	this.messages = messages;
	this.count = this.messages.length;
	this.faces_count = 0;
	this.faces = new Array();

	for( var m=0; m<messages.length; m++ ) {
	    var media = messages[m].media;
	    if ( media.views.face ) {
		for( var f=0; f<media.views.face.length; f++ ) {
		    var face = media.views.face[f];
		    this.faces.push( face );
		}
	    }
	}

	/** For testing ...
	this.faces.push( messages[0].media.views.thumbnail );
	this.faces.push( messages[0].media.views.thumbnail );
	this.faces.push( messages[0].media.views.thumbnail );
	this.faces.push( messages[0].media.views.thumbnail );
	this.faces.push( messages[0].media.views.thumbnail );
	this.faces.push( messages[0].media.views.thumbnail );
	this.faces.push( messages[0].media.views.thumbnail );
	**/

	this.faces_count = this.faces.length;
    };

    Incoming.prototype.dismiss = function() {
	var self = this;
	dialog.close(self);
    };

    Incoming.prototype.play = function() {
	var self = this;
	dialog.close(self);
	router.navigate( '#/player?mid=' + this.messages[0].media.uuid );
    };

    Incoming.prototype.nameFaces = function() {
	var self = this;
	dialog.close(self);
    };

    return Incoming;
});
