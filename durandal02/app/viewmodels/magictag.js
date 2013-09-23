define(['plugins/dialog'], function(dialog) {

    var MagicTag = function( face ) {
	var self = this;
	self.face = face;
	self.url = ko.observable( face.url() );
	self.named = ko.observable( false );
	self.sameas = ko.observable();
	self.aliases = ko.observableArray([]);

	self.last_x = 0;
	self.pic_index = 0;
	self.pic_num = 0;
	self.pics = null;

	// Data will contain the information passed back from
	// this dialog when it closes.  It will contain the uuid
	// of this contact, the name the user has specified,
	// and the contact_id of the existing contact if this
	// is a previously identified contact.
	//
	self.data = {};
	me = self;
    };

    MagicTag.prototype.dismiss = function() {
	// Pass the data back on close.
	dialog.close( this, this.data );
    };

    MagicTag.prototype.name = function() {
	var self = this;

	// previously known contact, if present
	var cid = $(self.view).find("#cname").data( 'cid' );

	// the name
	var contact_name = $(self.view).find("#cname").val();

	var ret = { uuid: self.face.data.uuid, cid: cid, contact_name: contact_name };

	var viblio = require( 'lib/viblio' );
//	viblio.api( '/services/faces/tag', ret ).then( function() {
	    self.face.name( contact_name );
	    self.data = ret;
	    self.dismiss();
//	});
    };

    MagicTag.prototype.activate = function() {
	var self = this;
	var viblio = require( 'lib/viblio' );
	return viblio.api( '/services/faces/photos_of', { cid: self.face.data.uuid } ).then( function( photos ) {
	    self.aliases( photos );
	});
    };

    MagicTag.prototype.swap = function( me, a ) {
	me.face.url( a );
	me.url( a );
    };

    MagicTag.prototype.compositionComplete = function(view, parent) {
	var self = this;
	self.view = view;
	self.ac = $(self.view).find("#cname").autocomplete({
	    source: '/services/faces/all_contacts',
	    minLength: 2,
	    focus: function( event, ui ) {
		$(self.view).find("#cname").val( ui.item.label );
		// self.sameas( ui.item.url );
		$(self.view).find(".is-same-as").css( 'visibility', 'visible' );
	    },
	    response: function( event, ui ) {
		self.named( true );
		if ( ui.content.length == 0 ) {
		    $(self.view).find("#cname").data( 'cid', null );
		    $(self.view).find(".is-same-as").css( 'visibility', 'hidden' );
		}
	    },
	    select: function( event, ui ) {
		$(self.view).find("#cname").val( ui.item.label );
		$(self.view).find("#cname").data( 'cid', ui.item.cid );
		return false;
	    }
	});

	/** Kind of cool, but too expensive and slow.

	$(self.view).find( ".magic-face" ).mouseover( function() {
	    // If we haven't already, fetch array of other pictures of this
	    // person as they've appeared in videos.
	    var viblio = require( 'lib/viblio' );
	    if ( ! self.pics ) {
		viblio.api( '/services/faces/photos_of', { cid: self.face.data.uuid } ).then( function( photos ) {
		    self.pic_num = photos.length;
		    self.pic_index = 0;
		    self.pics = photos;
		});
	    }
	});

	$(self.view).find( ".magic-face" ).mousemove( function( event ) {
	    // As the mouse moves, flip through the array of other photos
	    // available of this person.
	    if ( self.pics && self.pics.length && self.pics.length > 0 ) {
		if ( event.pageX < self.last_x && Math.abs( event.pageX - self.last_x ) > 2 ) {
		    // reverse direction
		    self.pic_index -= 1;
		    if ( self.pic_index < 0 ) self.pic_index = ( self.pic_num - 1 );
		    console.log( self.pic_index, self.pics[ self.pic_index ] );
		    self.url( self.pics[ self.pic_index ] );
		}
		else if ( Math.abs( event.pageX - self.last_x ) > 2 ) {
		    // forward direction
		    self.pic_index += 1;
		    if ( self.pic_index >= self.pic_num ) self.pic_index = 0;
		    console.log( self.pic_index, self.pics[ self.pic_index ] );
		    self.url( self.pics[ self.pic_index ] );
		}
		self.last_x = event.pageX;
	    }
	});

	**/
    };

    return MagicTag;
});
