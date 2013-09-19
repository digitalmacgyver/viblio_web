define(['plugins/dialog'], function(dialog) {

    var IMap = function( mediafile, options ) {
	this.media   = mediafile;
	this.options = options;
	this.points  = [];
    };

    IMap.prototype.dismiss = function() {
	dialog.close( this );
    };

    IMap.prototype.help = function() {
	var self = this;
	$(self.view).find( ".help" ).show();
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
		    self.points.push({
			lat: m.lat,
			lng: m.lng,
			location: m.lat.toString() + ',' + m.lng.toString(),
			uuid: m.uuid,
			title: m.title,
			url: m.url
		    });
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
	self.map  = $(self.view).find( ".map" ).vibliomap(self.options);

	self.points.forEach( function( p ) {
	    var m = self.map.addMarker( p.lat, p.lng, p );
	    m.bindPopup( '<img src="' + p.url + '" style="width:120px;height:68px;" />' );
	});
	self.map.fitBounds();

	$(self.view).draggable();
	$(self.view).find( ".map" ).resizable();
	//$(self.view).resizable();

	/**
	$(self.view).on("resizestart", function(event, ui) {
	    $(self.view).find(".modal-body, iframe").each(function() {
		var elem = $(this);
		elem.data("resizeoriginalheight", elem.height());
	    });
	});

	$(self.view).on("resize", function(event, ui) {
	    ui.element.css("margin-left", -ui.size.width/2);
	    ui.element.css("margin-top", -ui.size.height/2);
	    ui.element.css("top", "50%");
	    ui.element.css("left", "50%");

	    $(self.view).find(".modal-body,iframe").each(function() {
		var elem = $(this);
		$(this).css("min-height", elem.data("resizeoriginalheight") + ui.size.height - ui.originalSize.height);
	    });
	});
	**/

	self.map.enableSetLocation( function( latlng ) {
	    console.log( 'new location: ', latlng );
	    var viblio = require( "lib/viblio" );
	    viblio.api( '/services/geo/change_latlng', 
			{ mid: self.media().uuid,
			  lat: latlng.lat,
			  lng: latlng.lng } ).then( function() {
			      self.media().lat = latlng.lat;
			      self.media().lng = latlng.lng;
			      if ( self.options.doneCallback )
				  self.options.doneCallback( self.media() );
			      self.dismiss();
			  });
	});
    };

    return IMap;
});
