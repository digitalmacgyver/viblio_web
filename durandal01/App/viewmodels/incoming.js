/* The incoming video dialog
*/
<<<<<<< HEAD
define( ['plugins/router', 'plugins/dialog'], function(router, dialog) {
    var Incoming = function( messages ) {
	this.messages = messages;
	this.count = this.messages.length;
	this.faces_count = 0;
	this.faces = new Array();
=======
define( ['durandal/plugins/router'], function(router) {
    var Incoming = function( messages, dismiss_cb ) {
	this.messages = ko.observableArray();
	this.count = ko.observable(0);
	this.faces_count = ko.observable(0);
	this.faces = ko.observableArray();
>>>>>>> master

	this.dismiss_cb = dismiss_cb;

	this.update( messages );
    };

    Incoming.prototype.update = function( messages ) {
	var count = messages.length;
	for( var i=(count - 1); i>=0; i-- )
	    this.messages.unshift( messages[i] );
	this.count( this.count() + count );
	for( var m=0; m<count; m++) {
	    var media = messages[m].media;
	    if ( media.views.face ) {
		for( var f=0; f<media.views.face.length; f++ ) {
		    var face = media.views.face[f];
		    this.faces.push( face );
		}
	    }
	}
	this.faces_count( this.faces().length );
    };

    Incoming.prototype.dismiss = function() {
<<<<<<< HEAD
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
=======
	this.modal.close();
	this.dismiss_cb();
    };

    Incoming.prototype.play = function() {
	this.modal.close();
	this.dismiss_cb();
	router.navigateTo( '#/player?mid=' + this.messages[0].media.uuid );
    };

    Incoming.prototype.nameFaces = function() {
	this.modal.close();
	this.dismiss_cb();
>>>>>>> master
    };

    return Incoming;
});
