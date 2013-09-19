define(['durandal/app', 'plugins/router', 'lib/viblio'], function(app,router,viblio) {
    var Map = function() {
        this.points = [];
        this.markerTitle = ko.observable();
        this.markerImage = ko.observable();

	// When a new video appears in the system, add its location
	// to the map.
	var self = this;
	app.on( 'mediafile:ready', function( m ) {
	    if ( m.lat && m.lng ) {
		var p = {
		    lat: m.lat,
		    lng: m.lng,
		    location: m.lat.toString() + ',' + m.lng.toString(),
		    uuid: m.uuid,
		    title: m.title,
		    url: m.url
		};
		self.points.push( p );
		if ( self.map ) {
		    self.map.addMarker( p.lat, p.lng, p );
		    self.map.fitBounds();
		}
	    }
	});
    };

    Map.prototype.activate = function() {
	var self = this;
	// Obtain the list of points to display.  Need to make
	// a string out of lat, lng to work with knockout, and
	// need to add asset uuid so we can play the video when
	// the marker is clicked on.
	//
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

    Map.prototype.detached = function() {
	this.map.destroy();
	this.map = null;
    };

    Map.prototype.compositionComplete = function( view, parent ) {
	var self = this;
	self.view = view;

	// Create the map, enable mouse wheel and touch interaction
	console.log( 'creating a new map' );
	self.map = $(view).vibliomap({
	    markerClickCallback: function( mapper, data ) {
		self.play( data );
	    },
	    markerMouseoverCallback: function( mapper, data ) {
		self.enableDetails( data );
	    },
	    markerMouseoutCallback: function( mapper, data ) {
		self.disableDetails( data );
	    }
	});

	// Create an array of Location objects to center the map
	// around those points.
	self.points.forEach( function( p ) {
	    self.map.addMarker( p.lat, p.lng, p );
	});
	if ( self.points.length > 0 )
	    self.map.fitBounds();
	else
	    self.map.centerDefault();
    };

    Map.prototype.enableDetails = function(marker) {
	this.markerTitle( marker.title );
	this.markerImage( marker.url );
	$(this.view).find( '.marker-display' ).css( 'visibility', 'visible' );
    };

    Map.prototype.disableDetails = function(marker) {
	this.markerTitle();
	this.markerImage();
	$(this.view).find( '.marker-display' ).css( 'visibility', 'hidden' );
    };

    Map.prototype.play = function( point ) {
	// A point was clicked on.  Could popup a dialog to display
	// metadata (title, description, captured on date, length, etc)
	// and a play/cancel function maybe.  Or just go to player screen.
	router.navigate( '#/new_player?mid=' + point.uuid );
    };

    return Map;
    
});
