define(['plugins/dialog'], function(dialog) {

    var MagicTag = function( face ) {
	var self = this;
	self.face = face;
	self.url = ko.observable( face.url() );
	self.named = ko.observable( false );
	self.sameas = ko.observable();
	self.aliases = ko.observableArray([]);

	self.original_uri = face.url();
	self.new_uri = null;

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

	var ret = { uuid: self.face.data.uuid, 
		    cid: cid,
		    new_uri: self.new_uri,
		    contact_name: contact_name };

	var viblio = require( 'lib/viblio' );
	viblio.api( '/services/faces/tag', ret ).then( function() {
	    self.face.name( contact_name );
	    self.data = ret;
	    self.dismiss();
	});
    };

    MagicTag.prototype.activate = function() {
	var self = this;
	var viblio = require( 'lib/viblio' );
	return viblio.api( '/services/faces/photos_of', { cid: self.face.data.uuid } ).then( function( photos ) {
	    self.aliases( photos );
	});
    };

    MagicTag.prototype.swap = function( me, a ) {
	me.face.url( a.url );
	me.url( a.url );
	me.new_uri = a.uri;
	me.original_uri = a.url;
    };

    MagicTag.prototype.min = function( me, a ) {
	me.url( a.url );
    };

    MagicTag.prototype.mout = function( me, a ) {
	me.url( me.original_uri );
    };

    MagicTag.prototype.compositionComplete = function(view, parent) {
	var self = this;
	self.view = view;

	// The autocompleter
	//
	self.ac = $(self.view).find("#cname").autocomplete({
	    source: '/services/faces/all_contacts',
	    minLength: 2,
	    focus: function( event, ui ) {
		$(self.view).find("#cname").val( ui.item.label );
	    },
	    response: function( event, ui ) {
		self.named( true );
		if ( ui.content.length == 0 ) {
		    $(self.view).find("#cname").data( 'cid', null );
		}
	    },
	    select: function( event, ui ) {
		$(self.view).find("#cname").val( ui.item.label );
		$(self.view).find("#cname").data( 'cid', ui.item.cid );
		return false;
	    }
	}).data( "ui-autocomplete" )._renderItem = function( ul, item ) {
	    // Extend this jQuery Autocomplete widget to render not only the
	    // label, but also the picture, if there is one
	    console.log( 'In custom _renderItem' );
	    var image = 'css/images/nopic-red-90.png';
	    if ( item.url ) image = item.url;
	    return $("<li>")
		.append( $("<img>" ).attr( "src", image ).attr( "width", 25 ).attr( "height", 25 ) )
		.append( $("<a>" ).text( item.label ).css( "display", "inline" ) )
		.appendTo( ul );
	};

	if ( self.aliases().length == 0 ) {
	    $(view).find(".is-same-as").hide();
	}
	else {
	    // The horizontal scroller
	    $(view).find(".is-same-as").smoothDivScroll({
		visibleHotSpotBackgrounds: ""
	    });
	    $(self.view).find(".is-same-as").trigger( 'initialize' );
	    // Jeez!  Really gotta help this thing out with its calculations!  We know
	    // the little images are 40x40 and we know how many there are, so ...
	    $(self.view).find(".scrollableArea").css( "width", self.aliases().length * 40 );
	}
    };

    return MagicTag;
});
