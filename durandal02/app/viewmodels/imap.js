define(['plugins/dialog', 'lib/config'], function(dialog,config) {

    var IMap = function( mediafile, options ) {
	this.media   = mediafile;
	this.options = options;
	this.points  = [];
	this.dropped = ko.observable(false);
	this.isNear  = ko.observable('');
	this.paddr = ko.observable();
	this.lastLatLng = null;
    };

    IMap.prototype.dismiss = function() {
	dialog.close( this );
    };

    IMap.prototype.ok = function() {
	this.useLocation();
    };

    IMap.prototype.help = function() {
	var self = this;
	$(self.view).find( ".help" ).show();
    };

    IMap.prototype.useLocation = function() {
	var self = this;
	if ( self.lastLatLng ) {
	    var viblio = require( "lib/viblio" );
	    var latlng = self.lastLatLng;
	    viblio.api( '/services/geo/change_latlng', 
			{ mid: self.media().uuid,
			  addr: self.media().geo_address,
			  lat: latlng.lat(),
			  lng: latlng.lng() } ).then( function( result ) {
			      self.media().lat = latlng.lat();
			      self.media().lng = latlng.lng();
			      self.media().geo_address = result.address;
			      if ( self.options.doneCallback )
				  self.options.doneCallback( self.media() );
			      self.dismiss();
			  });
	}
    };

    IMap.prototype.helpHide = function() {
	var self = this;
	$(self.view).find( ".help" ).hide();
    };

    IMap.prototype.activate = function() {
	var self = this;
	// Obtain the list of points to display.  Need to make
	// a string out of lat, lng to work with knockout, and
	// need to add asset uuid so we can play the video when
	// the marker is clicked on.
	//
	var viblio = require( "lib/viblio" );
	return viblio.api( '/services/geo/all' ).then( function( json ) {
	    json.locations.forEach( function( m ) {
		if ( m.lat && m.lng ) {
		    if ( ! (self.options && self.options.relocate && 
			    self.media().lat == m.lat && self.media().lng == m.lng ) ) {
			self.points.push({
			    lat: m.lat,
			    lng: m.lng,
			    location: m.lat.toString() + ',' + m.lng.toString(),
			    uuid: m.uuid,
			    title: m.title,
			    url: m.url
			});
		    }
		}
	    });
	});
    };

    IMap.prototype.detached = function() {
	if ( self.map ) self.map.destroy();
	self.map = null;
    };

    IMap.prototype.penter = function( data, event ) {
	if ( event.keyCode == 13 ) 
	    this.geocode( $(this.view).find('input').val() );
    };

    // Given an address, get the lat/lng and google address and plot the point
    IMap.prototype.geocode = function( address ) {
	var self = this;
	if ( ! address ) return;
	self.helpHide();  // hide the help if it is still showing
	GMaps.geocode({
	    address: address,
	    callback: function( results, status ) {
		if ( status == 'OK' ) {
		    self.map.removeMarkers();  // remove all the other markers
		    var latlng = results[0].geometry.location;
		    var addr   = results[0].formatted_address;
		    self.paddr( addr );
		    self.map.setCenter(latlng.lat(), latlng.lng());
		    self.map.addMarker({
			lat: latlng.lat(),
			lng: latlng.lng()
		    });
		    self.map.setZoom(15);
		    self.lastLatLng = latlng;
		    self.dropped( true );
		}
		else {
		    self.paddr( 'Unable to map address' );
		    self.lastLatLng = null;
		    self.dropped( false );
		}
	    }
	});
    };

    IMap.prototype.compositionComplete = function(view, parent) {
	var self = this;
	self.view = view;

	$(self.view).find('input').blur( function() {
	    self.geocode( $(self.view).find('input').val() );
	});

	var initial_latlng = config.geoLocationOfVideoAnalytics.split(',');

	if ( self.media().geo_address ) self.paddr( self.media().geo_address );

	self.map = new GMaps({
	    div: $(self.view).find( ".map" ).get(0),
	    lat: parseFloat( self.media().lat || initial_latlng[0] ),
	    lng: parseFloat( self.media().lng || initial_latlng[1] ),
	});

	self.points.forEach( function( p ) {
	    self.map.addMarker({
		lat: parseFloat(p.lat), lng: parseFloat(p.lng),
		title: p.title,
		infoWindow: {
		    content: '<img src="' + p.url + '" style="width:120px;height:68px;" />',
		}
	    });
	});
	self.map.fitZoom();
    };

    return IMap;
});
