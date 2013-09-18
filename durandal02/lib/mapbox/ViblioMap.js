/*
  This is a very special purpose jQuery wrapper around the specific
  mapbox functionality we need on the Home and Player pages.  
*/

(function($) {
    var settings;
    var mapIcon;
    var va;

    $.fn.vibliomap = function( options ) {
	settings = $.extend({
	    tiles: 'aqpeeb.map-pu25jc1g',

	    disableZoomControl: false,
	    zoomControlPosition: 'topright',

	    disableMapDrag: false,
	    disableMapMouseZoom: true,
	    disableMapTouchZoom: true,
	    disableMapClickZoom: true,

	    defaultMarkerIconImage: 'css/images/mapMarker.png',
	    defaultMarkerIconSize: [ 26, 34 ],
	    defaultMarkerIconAnchor: null,

	    defaultSetIconImage: 'css/images/mapMarker-Blue.png',
	    defaultSetIconSize: [ 26, 34 ],
	    defaultSetIconAnchor: null,

	    markerClickCallback: null,
	    markerMouseoverCallback: null,
	    markerMouseoutCallback: null
	}, options);

	// Normal marker icon
	mapIcon = L.icon({
	    iconUrl: settings.defaultMarkerIconImage,
	    iconSize: settings.defaultMarkerIconSize,
	    iconAnchor: settings.defaultMarkerIconAnchor ||
		[ Math.floor(settings.defaultMarkerIconSize[0] / 2),
		  settings.defaultMarkerIconSize[1] - 1 ],
	    popupAnchor: [ -1, 
			   0 - settings.defaultMarkerIconSize[1] ]
	});

	// set location interactive icon
	setIcon = L.icon({
	    iconUrl: settings.defaultSetIconImage,
	    iconSize: settings.defaultSetIconSize,
	    iconAnchor: settings.defaultSetIconAnchor ||
		[ Math.floor(settings.defaultSetIconSize[0] / 2),
		  settings.defaultSetIconSize[1] - 1 ],
	    popupAnchor: [ -1, 
			   0 - settings.defaultSetIconSize[1] ]
	});

	// location of video analytics
	va = new L.LatLng( 37.45, -122.16 );

	return this.each(function() {
	    var map = L.mapbox.map($(this).get(0),
				   settings.tiles,
				   { zoomControl: false });
	    if ( ! settings.disableZoomControl )
		new L.Control.Zoom({ position: settings.zoomControlPosition }).addTo(map);
	    if ( settings.disableMapDrag == true ) map.dragging.disable();
	    if ( settings.disableMapMouseZoom == true ) map.scrollWheelZoom.disable();
	    if ( settings.disableMapTouchZoom == true ) map.touchZoom.disable();
	    if ( settings.disableMapClickZoom == true ) map.doubleClickZoom.disable();
	    map.setView( va, 14 );
	    // The map has a pointer to this ...
	    map._viblio = $(this);
	    // and this has a pointer to map!
	    $(this).data( 'map', map );
	    // and an array of latlng (which also have a pointer to marker _m)
	    $(this).data( 'markers', [] );
	    // and settings
	    $(this).data( 'settings', settings );
	});
    };

    // Not using this ... its how to make a custom control button, in case
    // designers object to the popup.
    HelloWorldControl = function(theHelloWorldFunction) {
	var control = new (L.Control.extend({
	    options: { position: 'topright' },
	    onAdd: function (map) {
		var self = this;
		self._map = map;
		controlDiv = L.DomUtil.create('div', 'hello-world-button');
		L.DomEvent
		    .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
		    .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
		    .addListener(controlDiv, 'click', function( event ) {
			if ( setMarker )
			    self._map.removeLayer( setMarker );
			self._map.once( 'click', setLocationHandler );
			self.HelloWorldFunction( event, self._map );
		    });
		
		// Set CSS for the control border
		var controlUI = L.DomUtil.create('div', 'hello-world-button-border', controlDiv);
		controlUI.title = 'Click for Hello World!';

		// Set CSS for the control interior
		var controlText = L.DomUtil.create('div', 'hello-world-button-interior', controlUI);
		controlText.innerHTML = 'Hello World';
		
		return controlDiv;
	    }
	}));

	control.HelloWorldFunction = theHelloWorldFunction;

	return control;
    };


    // Add a marker.  If zoomTo is true, then zoom the map
    // to show this marker in center.
    $.fn.addMarker = function( lat, lng, data, zoomTo ) {
	var self = $(this);
	var ll = new L.LatLng( lat, lng );
	var m = L.marker( ll, {icon: mapIcon} ).addTo( self.data( 'map' ) );
	ll._m = m; // add a pointer to the marker, needed in removeAllMarkers()
	self.data( 'markers' ).push( ll ); // Keep it around
	m.data = data; // attach data to it for callbacks

	// Set up the callbacks
	if ( self.data( 'settings' ).markerClickCallback )
	    m.on( 'click', function( event ) {
		self.data( 'settings' ).markerClickCallback( self, event.target.data );
	    });
	if ( self.data( 'settings' ).markerMouseoverCallback )
	    m.on( 'mouseover', function( event ) {
		self.data( 'settings' ).markerMouseoverCallback( self, event.target.data );
	    });
	if ( self.data( 'settings' ).markerMouseoutCallback )
	    m.on( 'mouseout', function( event ) {
		self.data( 'settings' ).markerMouseoutCallback( self, event.target.data );
	    });

	// Zoom to it if called for
	if ( zoomTo )
	    self.data( 'map' ).setView( ll, 16 );
    };

    // Default center and zoom
    $.fn.centerDefault = function() {
	var self = $(this);
	self.data( 'map' ).setView( va, 16 );
    };

    // Zoom to fit current list or markers
    //
    $.fn.fitBounds = function() {
	var self = $(this);
	self.data( 'map' ).fitBounds( self.data( 'markers' ) );
    };
    
    // Support for the Set Location functions
    var setMarker;
    var setMarkerCallback;
    var lastLatLng;

    // When the map is clicked on in Set Location mode
    function setLocationHandler( event ) {
	var map = event.target;
	var latlng = event.latlng;
	lastLatLng = latlng; // remember this location
	// create a draggable marker
	setMarker = L.marker( lastLatLng, {icon: setIcon, draggable: true} ).addTo( map );
	// The popup
	var startOverButton = $('<button>Remove and start over</button>');
	$(startOverButton).click( function() {
	    if ( setMarker )
		map.removeLayer( setMarker );
	    map.once( 'click', setLocationHandler );
	});
	var useButton = $('<button>Use this location</button>');
	$(useButton).click( function() {
	    if ( map._viblio ) {
		map._viblio.disableSetLocation();
	    }
	    if ( setMarkerCallback ) setMarkerCallback( lastLatLng );
	});
	var popupButtons = $('<div class="viblio-map-popup"></div>');
	$(popupButtons).append( $(startOverButton) );
	$(popupButtons).append( $(useButton) );
	setMarker.bindPopup(popupButtons.get(0));
	setMarker.on( 'dragend', function( event ) {
	    lastLatLng = event.target._latlng; // keep track of lat/lng
	});
    }

    // Remove all current markers
    //
    $.fn.removeAllMarkers = function() {
	var self = $(this);
	var marker;
	while( marker = self.data( 'markers' ).pop() ) {
	    self.data( 'map' ).removeLayer( marker._m );
	}
    };

    // Turn this map into a 'Set Location' widget
    //
    $.fn.enableSetLocation = function( callback ) {
	var self = $(this);
	setMarkerCallback = callback;
	// Add the mapbox geocoder, a search box that helps get
	// close to locations on the map
	self.data( 'geocoder', L.mapbox.geocoderControl( 
	    self.data( 'settings' ).tiles, 
	    { position: self.data( 'settings' ).zoomControlPosition }
	));
	self.data( 'map' ).addControl( self.data( 'geocoder' ) );
	// where we would add custom buttons if we end up using them
	//self.data( 'map' ).addControl( HelloWorldControl( function( mouseevent, map ) {
	//    console.log( map );
	//}));
	self.data( 'map' ).once( 'click', setLocationHandler );
    };

    $.fn.disableSetLocation = function() {
	var self = $(this);
	if ( self.data( 'geocoder' ) )
	    self.data( 'geocoder' ).removeFrom( self.data( 'map' ) );
	self.data( 'geocoder', null );
	if ( setMarker )
	    self.data( 'map' ).removeLayer( setMarker );
	setMarker = null;
	self.data( 'map' ).off( 'click', setLocationHandler );
    };

    // Destroys the map and clears all related event listeners
    $.fn.destroy = function() {
	var self = $(this);
	self.data( 'map' ).remove();
    };

}( jQuery ));
