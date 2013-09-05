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
<<<<<<< HEAD
	this.points.push({
	    lat: 37.7749295, 
	    lng: -122.4194155,
	    location: "37.7749295, -122.4194155",
	    uuid: 'sss1'
	});
	this.points.push({
	    lat: 37.8043722, 
	    lng: -122.2708026,
	    location: "37.8043722, -122.2708026",
	    uuid: 'sss2'
	});
	this.points.push({
	    lat: 37.8715926, 
	    lng: -122.272747,
	    location: "37.8715926, -122.272747",
	    uuid: 'sss3'
	});
	return viblio.api( '/services/mediafile/list' ).then( function( json ) {
	    var cc = 0;
	    json.media.forEach( function( m ) {
		if ( m.lat && m.lng ) {
		    /**
=======
	return viblio.api( '/services/mediafile/list' ).then( function( json ) {
	    json.media.forEach( function( m ) {
		if ( m.lat && m.lng ) {
>>>>>>> master
		    self.points.push({
			lat: m.lat,
			lng: m.lng,
			location: m.lat.toString() + ',' + m.lng.toString(),
			uuid: m.uuid,
<<<<<<< HEAD
			thumbnail: m.views.thumbnail.url
		    });
		    **/
		    // FAKE REMOVE ME!!!
		    self.points()[cc].uuid = m.uuid;
		    self.points()[cc].thumbnail = '<img class="popover-img" src="' + m.views.thumbnail.url + '" />';
		    cc += 1;
		    if ( cc > 2 ) cc = 0;
=======
			thumbnail: '<img class="popover-img" src="' + m.views.thumbnail.url + '" />'
		    });
>>>>>>> master
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
	$(view).find(".marker i").popover({
	    trigger: 'hover',
	    html: true
	});

    };

    Map.prototype.play = function( point, a, b ) {
	// A point was clicked on.  Could popup a dialog to display
	// metadata (title, description, captured on date, length, etc)
	// and a play/cancel function maybe.  Or just go to player screen.
	console.log( "play", point.uuid );
	router.navigate( '#/player?mid=' + point.uuid );
	//console.log( a, b );
	//$(a.target).popover( 'toggle' );
    };

    return Map;
    
});
