define(['durandal/app', 'plugins/router', 'lib/viblio', 'modestmap'], function(app,router,viblio,MM) {
    var Map = function() {
	this.points = ko.observableArray([]);
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
			thumbnail: '<img class="popover-img" src="' + m.url + '" />'
		    });
		}
	    });
	});
    };

    Map.prototype.compositionComplete = function( view, parent ) {
	var self = this;

	// Create the map, enable mouse wheel and touch interaction
	self.map = $(view).htmapl({
	    touch: true,
            mousewheel: true
	});
	// Create an array of Location objects to center the map
	// around those points.
	var ext = [];
	self.points().forEach( function( p ) {
	    ext.push( new MM.Location( p.lat, p.lng ) );
	});
	if ( ext.length )
	    self.map.extent( ext );
	else
	    console.log( 'NO POINTS' );

	// Enable popovers
	$(view).find(".marker img").popover({
	    trigger: 'hover',
	    html: true
	});

    };

    Map.prototype.play = function( point, a, b ) {
	// A point was clicked on.  Could popup a dialog to display
	// metadata (title, description, captured on date, length, etc)
	// and a play/cancel function maybe.  Or just go to player screen.
	console.log( "play", point.uuid );
	router.navigate( '#/new_player?mid=' + point.uuid );
	//console.log( a, b );
	//$(a.target).popover( 'toggle' );
    };

    return Map;
    
});
