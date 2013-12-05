define(['durandal/app', 'plugins/router', 'lib/viblio', 'viewmodels/mediafile', 'lib/customDialogs'], function(app,router,viblio,Mediafile,customDialogs) {
    var Map = function() {
        this.points = [];
        this.markerTitle = ko.observable();
        this.markerImage = ko.observable();
        
        this.pointIsSelected = ko.observable(false);
        this.selectedPoint = ko.observable();
        this.pointsInRange = ko.observableArray([]);
        
        function hh(title, subtitle, options) {
            return system.defer( function( dfd ) {
                dfd.resolve( new HScroll(title, subtitle, options) );
            } ).promise();
        };

	// When a new video appears in the system, add its location
	// to the map.
	var self = this;
	app.on( 'mediafile:ready', function( m ) {
            
            function shareVid(e){
                e.stopPropagation();
                viblio.api( '/services/mediafile/get', { mid: $(this).parent()[0].id, include_contact_info: 1 } ).then(function( json ){
                    customDialogs.showShareVidModal( new Mediafile( json.media ) );
                });
            };

            function playVid(){
                router.navigate( 'new_player?mid=' + this.id );
            };
            
	    if ( m.lat && m.lng ) {
		var p = {
		    lat: m.lat,
		    lng: m.lng,
		    location: m.lat.toString() + ',' + m.lng.toString(),
		    uuid: m.uuid,
		    title: m.title,
		    url: m.views.poster.url,
                    eyes: m.view_count
		};
		self.points.push( p );
		if ( self.map ) {
		    var popupContent = $('<div />');
                        popupContent.on('click', '.shareFromMap', shareVid);
                        popupContent.on('click', '.thumb-wrap', playVid);
                        popupContent.html('<div title="Click to watch this video" id="' + p.uuid + '" class="pointer thumb-wrap">\n\
                                                <div title="Click to share this video" class="shareFromMap btn btn-primary"><img src="css/images/share-white.png"/></div>\n\
                                                <img src="' + p.url + '" />\n\
                                            </div>\n\
                                           <div class="information">\n\
                                                <div class="aux pull-right muted">\n\
                                                    <img src="css/images/viewsEye.png"/><br>\n\
                                                    <span>' + p.eyes + '</span>\n\
                                                </div>\n\
                                                <div data-bind="liveEditor: title, ifnot: ro">\n\                                                    <div class="view vidTitle title truncate" data-bind="click: title.edit">' + p.title() + '</div>\n\
                                                    <div class="editTitle-Wrap">\n\
                                                        <input type="text" class="edit" data-bind="value: title,hasFocus: title.editing, event: { blur: function() { title.stopEditing(); title.save( $data, media(), \'mediaFile:TitleDescChanged\' ) } }" />\n\
                                                    </div>\n\
                                                </div>\n\
                                                <div data-bind="if: ro">\n\
                                                  <div class="view title truncate" data-bind="text: title() || \'no title\' "></div>\n\
                                                </div>\n\
                                         </div>');

                    m.bindPopup(popupContent[0],{
                        closeButton: false
                    });
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
            console.log(json);
            var eyes;
	    json.locations.forEach( function( m ) {
		if ( m.lat && m.lng ) {
                    if( m.view_count && m.view_count!= 'undefined') {
                        eyes = m.view_count;
                    } else {
                        eyes = 0;
                    }
		    self.points.push({
			lat: m.lat,
			lng: m.lng,
			location: m.lat.toString() + ',' + m.lng.toString(),
			uuid: m.uuid,
			title: m.title,
			url: m.url,
                        eyes: eyes
		    });
		}
	    });
	});
    };

    Map.prototype.detached = function() {
	this.map.destroy();
	this.map = null;
    };

    Map.prototype.resize = function() {
	var self = this;
	if ( self.map ) {
	    self.map.data( "map" ).invalidateSize();
	    self.map.fitBounds();
	}
    };
	

    Map.prototype.compositionComplete = function( view, parent ) {
	var self = this;
	self.view = view;
	// Create the map, enable mouse wheel and touch interaction
	self.map = $('.map-wrap').vibliomap({
            disableMapMouseZoom: true,
	    disableMapTouchZoom: false,
	    disableMapClickZoom: false
	});
        
        function shareVid(e){
            e.stopPropagation();
            viblio.api( '/services/mediafile/get', { mid: $(this).parent()[0].id, include_contact_info: 1 } ).then(function( json ){
                customDialogs.showShareVidModal( new Mediafile( json.media ) );
            });
        };
        
        function playVid(){
            router.navigate( 'new_player?mid=' + this.id );
        };
        
        // Used to see what points are around the one that is currently selected
        function getClosePoints( point ) {
            // clear out any previously exisitng elements
            self.pointsInRange.removeAll();
            // create a rectanlge around the point that is clicked to allow the creation of a list of other points in the same area
            var myShapeBounds = [ [point.properties.lat - .10, point.properties.lng - .15], [point.properties.lat + .10, point.properties.lng + .15] ];
            
            var myShape = L.rectangle(myShapeBounds, {color: "#ff7800", weight: 1}).addTo(self.map.data('map'));
            var bounds = myShape.getBounds();
            
            self.map.data('map').markerLayer.eachLayer(function(marker) {
                if (bounds.contains(marker.getLatLng())) {
                    self.pointsInRange.push(marker.feature.properties);
                    //console.log(self.pointsInRange());
                }
            });
            
            // removes the rectangle so it's not shown on the map
            //self.map.data('map').removeLayer(myShape);
        };
        
        self.settings = {
            defaultMarkerIconImage: 'css/images/mapMarker.png',
	    defaultMarkerIconSize: [ 26, 34 ],
	    defaultMarkerIconAnchor: null
        };
        
        // Normal marker icon
	self.mapIcon = L.icon({
	    iconUrl: self.settings.defaultMarkerIconImage,
	    iconSize: self.settings.defaultMarkerIconSize,
	    iconAnchor: self.settings.defaultMarkerIconAnchor ||
		[ Math.floor(self.settings.defaultMarkerIconSize[0] / 2),
		  self.settings.defaultMarkerIconSize[1] - 1 ],
	    popupAnchor: [ -1, 
			   0 - self.settings.defaultMarkerIconSize[1] ]
	});
        
	// Create an array of Location objects to center the map
	// around those points.
        var features = [];
	self.points.forEach( function( p ) {
            //var m = self.map.addMarker( p.lat, p.lng, p );
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [p.lng, p.lat]
                },
                properties: {
                    icon: {
                        iconUrl: self.settings.defaultMarkerIconImage,
                        iconSize: self.settings.defaultMarkerIconSize,
                        iconAnchor: self.settings.defaultMarkerIconAnchor ||
                            [ Math.floor(self.settings.defaultMarkerIconSize[0] / 2),
                              self.settings.defaultMarkerIconSize[1] - 1 ],
                        popupAnchor: [ -1, 
                                       0 - self.settings.defaultMarkerIconSize[1] ]    
                    },
                    lat: parseFloat(p.lat),
                    lng: parseFloat(p.lng),
                    uuid: p.uuid,
                    title: p.title,
                    url: p.url,
                    eyes: p.eyes
                }
            });
        });
        
        // Set a custom icon on each marker based on feature properties
        self.map.data('map').markerLayer.on('layeradd', function(e) {
            var marker = e.layer,
                feature = marker.feature;

            marker.setIcon(L.icon(feature.properties.icon));
        });
        
        // Add a markerLayer full of all the geo points to the map
        self.map.data('map').markerLayer.setGeoJSON(features,{
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: self.mapIcon });
            }
        });
        
        // For each point in the markerLayer add the popup content
        self.map.data('map').markerLayer.eachLayer(function(marker) {
            var popupContent = $('<div />');
                popupContent.on('click', '.shareFromMap', shareVid);
                popupContent.on('click', '.thumb-wrap', playVid);
                popupContent.html('<div title="Click to watch this video" id="' + marker.feature.properties.uuid + '" class="pointer thumb-wrap">\n\
                                        <div title="Click to share this video" class="shareFromMap btn btn-primary"><img src="css/images/share-white.png"/></div>\n\
                                        <img src="' + marker.feature.properties.url + '" />\n\
                                    </div>\n\
                                   <div class="information">\n\
                                        <div class="aux pull-right muted">\n\
                                            <img src="css/images/viewsEye.png"/><br>\n\
                                            <span>' + marker.feature.properties.eyes + '</span>\n\
                                        </div>\n\
                                        <div data-bind="liveEditor: title, ifnot: ro">\n\
                                            <div class="view vidTitle title truncate" data-bind="click: title.edit">' + marker.feature.properties.title + '</div>\n\
                                            <div class="editTitle-Wrap">\n\
                                                <input type="text" class="edit" data-bind="value: title,hasFocus: title.editing, event: { blur: function() { title.stopEditing(); title.save( $data, media(), \'mediaFile:TitleDescChanged\' ) } }" />\n\
                                            </div>\n\
                                        </div>\n\
                                        <div data-bind="if: ro">\n\
                                          <div class="view title truncate" data-bind="text: title() || \'no title\' "></div>\n\
                                        </div>\n\
                                 </div>');
            marker.bindPopup(popupContent[0],{
                closeButton: false
            });
        });
        // add popup open callbacks
        self.map.data('map').markerLayer.on('popupopen', function(e){
            self.pointIsSelected(true);
            self.selectedPoint(e.feature);
            getClosePoints( e.layer.feature );
        });
        // add popup closed callbacks
        self.map.data('map').markerLayer.on('popupclose', function(){
            self.pointIsSelected(false);
        });
        
        // Center map around points on markerLayer
	if ( features.length > 0 ) {
            var bounds = self.map.data('map').markerLayer.getBounds();
            self.map.data('map').fitBounds(bounds);
        } else {
	    self.map.data('map').centerDefault( { 'loc': new L.LatLng( 37, -95 ), 'zoom': 5 } );
        }
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
	router.navigate( 'new_player?mid=' + point.uuid );
    };

    return Map;
    
});