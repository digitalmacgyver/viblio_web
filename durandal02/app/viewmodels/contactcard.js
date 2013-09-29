define(['plugins/dialog'], function(dialog) {

    var CC = function( face ) {
	var self = this;
	self.face = face;
	self.url = ko.observable( face.url() );
	self.name = ko.observable( face.name() );
	self.email = ko.observable( face.email() );
	self.named = ko.observable( false );
	self.aliases = ko.observableArray([]);

	self.original_uri = face.url;
	self.new_uri = null;

	// Data will contain the information passed back from
	// this dialog when it closes.  It will contain the uuid
	// of this contact, the name the user has specified,
	// and the contact_id of the existing contact if this
	// is a previously identified contact.
	//
	self.data = {};
	me = self;

	self.name.subscribe( function(v) {
	    self.named( true );
	});
	self.email.subscribe( function(v) {
	    self.named( true );
	});
    };
    
    CC.prototype.dismiss = function() {
	// Pass the data back on close.
	dialog.close( this, this.data );
    };

    CC.prototype.done = function() {
	var self = this;

	// previously known contact, if present
	var cid = $(self.view).find("#cname").data( 'cid' );

	// the name
	var contact_name = self.name();
	var contact_email = self.email();

	var ret = { uuid: self.face.data.uuid, 
		    cid: cid,
		    new_uri: self.new_uri,
		    contact_name: contact_name,
		    contact_email: contact_email
		  };

	var viblio = require( 'lib/viblio' );
	viblio.api( '/services/faces/change_contact', ret ).then( function() {
	    self.face.name( contact_name );
	    self.face.email( contact_email );
	    self.data = ret;
	    self.dismiss();
	});
    };

    CC.prototype.activate = function() {
	var self = this;
	var viblio = require( 'lib/viblio' );
	return viblio.api( '/services/faces/photos_of', { cid: self.face.data.uuid } ).then( function( photos ) {
	    self.aliases( photos );
	});
    };

    CC.prototype.swap = function( me, a ) {
	me.face.url( a.url );
	me.url( a.url );
	me.new_uri = a.uri;
	me.named( true );
    };

    CC.prototype.compositionComplete = function(view, parent) {
	var self = this;
	self.view = view;
    };

    return CC;
});
