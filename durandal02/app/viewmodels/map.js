define(['durandal/app', 'plugins/router', 'lib/viblio', 'viewmodels/mediafile', 'lib/customDialogs', 'viewmodels/hscroll', 'durandal/events', 'viewmodels/help'], function(app,router,viblio,Mediafile,customDialogs,HScroll,events,Help) {
    var Map = function() {
        var self = this;
        self.points = [];
        self.help = new Help( 'help/mapHelp.html', 'stickyTop' );
        self.markerTitle = ko.observable();
        self.markerImage = ko.observable();
        
        self.pointIsSelected = ko.observable(false);
        self.selectedPoint = ko.observable();
        self.pointsInRange = ko.observableArray([]);
        
        self.showVidStrip = ko.observable(false);
        
        // used to add to or create new album from videos
        self.albumLabels = ko.observableArray();
        self.selectedAlbum = ko.observable();
        
        // list of video uuids used to create new album
        self.selectedVideos = ko.observableArray();
        
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
		/*if ( self.map ) {
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
		}*/
	    }
	});
    };
    
    Map.prototype.getAllAlbumsLabels = function() {
        var self = this;
        self.albumLabels.removeAll();
        viblio.api( '/services/album/album_names' ).then( function(data) {
            var arr = [];
            data.albums.forEach( function( album ) {
                var _album = album;
                _album.label = album.title;
                _album.selected = ko.observable( false );
                _album.shared = album.is_shared;
                arr.push( _album );
            });
            
            //alphabetically sort the list - toLowerCase() makes sure this works as expected
            arr.sort(function(left, right) { return left.label.toLowerCase() == right.label.toLowerCase() ? 0 : (left.label.toLowerCase() < right.label.toLowerCase() ? -1 : 1) });
            self.albumLabels( arr );
            
            self.albumLabels.unshift( {label: "Create New Album", selected: ko.observable(false)} );
        });
    };
    
    Map.prototype.getVidUUIDs = function() {
        var self = this;
        
        if ( self.selectedVideos().length > 0 ) {
            self.selectedVideos.removeAll();
        }
        
        self.pointsInRange().forEach(function(vid) {
            self.selectedVideos.push(vid.uuid);
        });
    };
    
    Map.prototype.albumSelected = function( self, album ) {
        self.getVidUUIDs( self );
        if ( self.selectedVideos().length > 0 ) {
            self.albumLabels().forEach( function( a ) {
                a.selected( false );
            });
            album.selected( true );
            self.selectedAlbum( album );
            self.addOrCreateAlbum();
        }    
    };
    
    Map.prototype.addOrCreateAlbum = function() {
        var self = this;
        
        if ( self.selectedVideos().length > 0 ) {
            // Create a new album
            if( self.selectedAlbum().label === 'Create New Album' ) {          
                viblio.api( '/services/album/create', { name: 'Click to name this album', list: self.selectedVideos() } ).then( function( data ) {
                    router.navigate( 'viewAlbum?aid=' + data.album.uuid );
                });
            } else {
                // Add to an existing album
                viblio.api( '/services/album/create', { aid: self.selectedAlbum().uuid, list: self.selectedVideos() } ).then( function( data ) {
                    var vidOrVids = self.selectedVideos().length == 1 ? ' video' : ' videos';
                    var msg = self.selectedVideos().length + vidOrVids + ' successfully added to your "' + self.selectedAlbum().label + '" Album';
                    viblio.notify( msg, 'success' );
                });        
                // Used to close the dropdown
                $("body").trigger("click");
            }    
        }
    };

    Map.prototype.activate = function() {
	var self = this;
        
        self.getAllAlbumsLabels();
        
	// Obtain the list of points to display.  Need to make
	// a string out of lat, lng to work with knockout, and
	// need to add asset uuid so we can play the video when
	// the marker is clicked on.
	//
	return viblio.api( '/services/geo/all' ).then( function( json ) {
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
            var myShapeBounds = [ [point.properties.lat - .005, point.properties.lng - .007], [point.properties.lat + .005, point.properties.lng + .007] ];
            
            var myShape = L.rectangle(myShapeBounds).addTo(self.map.data('map'));
            var bounds = myShape.getBounds();
            
            self.map.data('map').markerLayer.eachLayer(function(marker) {
                if (bounds.contains(marker.getLatLng())) {
                    self.pointsInRange.push(marker.feature.properties);
                    //viblio.log(self.pointsInRange());
                }
            });
            
            // removes the rectangle so it's not shown on the map
            self.map.data('map').removeLayer(myShape);
        };
        
        self.settings = {
            defaultMarkerIconImage: 'css/images/mapMarker.png',
	    defaultMarkerIconSize: [ 26, 34 ],
	    defaultMarkerIconAnchor: null
        };
        
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
                                        <div title="Click to share this video" class="shareFromMap overlay-icon right"><i class="fa fa-share"></i></div>\n\
                                        <img src="' + marker.feature.properties.url + '" />\n\
                                    </div>\n\
                                   <div class="information">\n\
                                        <div class="aux pull-right" title="View count">\n\
                                            <!--<i class="fa fa-eye-open"></i><br>-->\n\
                                            <span>' + marker.feature.properties.eyes + '</span>\n\
                                            <br><span class="small">Fan</span><br><span class="small">Views</span>\n\
                                        </div>\n\
                                        <div>\n\
                                          <div class="view vidTitle title truncate">' + marker.feature.properties.title + '</div>\n\
                                        </div>\n\
                                 </div>');
            marker.bindPopup(popupContent[0],{
                closeButton: false
            });
        });
        // If the currently opened point is clicked then close it and hide the top section (based on self.pointIsSelected() )
        self.map.data('map').markerLayer.on('click', function(e) {
            if( self.selectedPoint() ==  e.layer.feature ) {
                self.pointIsSelected(false);
                self.showVidStrip(false);
            }
        });
        // When the map is clicked (not a point) then close the top section
        self.map.data('map').on('click', function(e) {
            self.pointIsSelected(false);
            self.showVidStrip(false);
        });
        // add popup open callbacks
        self.map.data('map').markerLayer.on('popupopen', function(e){
            self.pointIsSelected(true);
            self.selectedPoint(e.layer.feature);
            getClosePoints( e.layer.feature );
            // If there are more than one videos near the selected point then show the videos in the top strip
            if (self.pointsInRange().length > 1) {
                self.showVidStrip(true);
		$(self.view).find( ".mapSD-scroll" ).trigger( 'children-changed' );
            } else {
                self.showVidStrip(false);
                self.pointsInRange.removeAll();
            }
        });
        
        // Center map around points on markerLayer
	if ( features.length > 0 ) {
            var bounds = self.map.data('map').markerLayer.getBounds();
            self.map.data('map').fitBounds(bounds);
        } else {
            self.map.data('map').setView({ lat: 35, lon: -35 }, 3);
        }
        
        $( window ).bind('resize scroll', self.stickyHelp );
    };
    
    // Makes the map instructions 'sometimes sticky' - stays above the footer, otherwise always at the bottom of the window
    Map.prototype.stickyHelp = function() {
        var maxPos = 202; //height of footer
        var distanceFromBottom = $(document).height()-( $(window).scrollTop()+$(window).height() );
        if(distanceFromBottom <= maxPos){
            $( '.missingVideos' ).css( 'position','absolute' );
        }else{
            $( '.missingVideos' ).css( 'position','fixed' );
        }
    };
    
    Map.prototype.toggleInstructions = function() {
        if( $( '.missingVideos' ).css( 'bottom' ) == '0px' ) {
            $( '.missingVideos' ).css( 'bottom', '-252px' );
            $( '.missingVideos .tab' ).css( 'opacity', '.6');
            $( '.missingVideos .tab' ).hover( function(){ $(this).css( 'opacity', '.8'); }, function(){ $(this).css( 'opacity', '.6'); } );
        } else {
            $( '.missingVideos' ).css( 'bottom', '0' );
            $( '.missingVideos .tab' ).css( 'opacity', '.8');
            $( '.missingVideos .tab' ).off( "mouseenter mouseleave" );
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
    
    Map.prototype.detached = function() {
	this.map.destroy();
	this.map = null;
        $(window).unbind('resize scroll', this.stickyHelp );
    };

    Map.prototype.resize = function() {
	var self = this;
	if ( self.map ) {
	    self.map.data( "map" ).invalidateSize();
	    self.map.fitBounds();
	}
    };
    
    return Map;
    
});