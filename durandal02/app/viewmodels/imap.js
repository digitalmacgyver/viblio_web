define(['plugins/dialog', 'lib/config'], function(dialog,config) {

    // Extracts an address from the structure returned from
    // a call on the server to http://maps.googleapis.com
    //
    function getCountry(results)
    {
	return results[0].formatted_address;
	for (var i = 0; i < results[0].address_components.length; i++) {
            var shortname = results[0].address_components[i].short_name;
            var longname = results[0].address_components[i].long_name;
            var type = results[0].address_components[i].types;
            if (type.indexOf("country") != -1) {
		if (!isNullOrWhitespace(shortname)) {
                    return shortname;
		}
		else {
                    return longname;
		}
            }
	}
    }
    
    function isNullOrWhitespace(text) {
	if (text == null) {
            return true;
	}
	return text.replace(/\s/gi, '').length < 1;
    }

    var IMap = function( mediafile, options ) {
	this.media   = mediafile;
	this.options = options;
	this.points  = [];
	this.dropped = ko.observable(false);
	this.isNear  = ko.observable('');
	this.paddr = ko.observable();
    };

    IMap.prototype.dismiss = function() {
	dialog.close( this );
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
			  lat: latlng.lat,
			  lng: latlng.lng } ).then( function( result ) {
			      self.media().lat = latlng.lat;
			      self.media().lng = latlng.lng;
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

    IMap.prototype.compositionComplete = function(view, parent) {
	var self = this;
	self.view = view;

	var initial_latlng = config.geoLocationOfVideoAnalytics.split(',');

	if ( self.media().geo_address ) self.paddr( self.media().geo_address );

	//self.map  = $(self.view).find( ".map" ).vibliomap(self.options);
	self.map = new GMaps({
	    div: $(self.view).find( ".map" ).get(0),
	    lat: parseFloat( self.media().lat || initial_latlng[0] ),
	    lng: parseFloat( self.media().lng || initial_latlng[1] ),
	});

	self.points.forEach( function( p ) {
	    //var m = self.map.addMarker( p.lat, p.lng, p );
	    //m.bindPopup( '<img src="' + p.url + '" style="width:120px;height:68px;" />' );
	    self.map.addMarker({
		lat: parseFloat(p.lat), lng: parseFloat(p.lng),
		title: p.title,
		infoWindow: {
		    content: '<img src="' + p.url + '" style="width:120px;height:68px;" />',
		}
	    });
	});
	self.map.fitZoom();

	//$(self.view).draggable();
	//$(self.view).find( ".map" ).resizable();

	/**
	self.map.enableSetLocation( function( latlng ) {
	    var viblio = require( "lib/viblio" );
	    viblio.api( '/services/geo/change_latlng', 
			{ mid: self.media().uuid,
			  lat: latlng.lat,
			  lng: latlng.lng } ).then( function( result ) {
			      self.media().lat = latlng.lat;
			      self.media().lng = latlng.lng;
			      self.media().geo_address = result.address;
			      self.isNear( result.address || '' );
			      if ( self.options.doneCallback )
				  self.options.doneCallback( self.media() );
			      self.dismiss();
			  });
	}, function( latlng ) {
	    self.dropped( true );
	    self.lastLatLng = latlng;
	});
	**/
    };

    return IMap;
});
