define(['durandal/app', 'plugins/router', 'lib/viblio', 'viewmodels/mediafile', 'lib/customDialogs'], function(app,router,viblio,Mediafile,customDialogs) {
    var Map = function() {
        this.points = [];
        this.markerTitle = ko.observable();
        this.markerImage = ko.observable();

	// When a new video appears in the system, add its location
	// to the map.
	var self = this;
	app.on( 'mediafile:ready', function( m ) {
            
            function shareVid(e){
                e.stopPropagation();
                viblio.api( '/services/mediafile/get', { mid: $(this).parent()[0].id, include_contact_info: 1 } ).then(function( json ){
                    customDialogs.showShareVidModal( new Mediafile( json.media ) );
                });
            }

            function playVid(){
                router.navigate( 'new_player?mid=' + this.id );
            }
            
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
                                                <div data-bind="liveEditor: title, ifnot: ro">\n\
                                                    <div class="view vidTitle title truncate" data-bind="click: title.edit">' + p.title() + '</div>\n\
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
	    json.locations.forEach( function( m ) {
		if ( m.lat && m.lng ) {
		    self.points.push({
			lat: m.lat,
			lng: m.lng,
			location: m.lat.toString() + ',' + m.lng.toString(),
			uuid: m.uuid,
			title: ko.observable(m.title),
			url: m.url,
                        eyes: m.view_count
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
	    /*markerClickCallback: function( mapper, data ) {
		self.play( data );
	    }*/
	});
        
        function shareVid(e){
            e.stopPropagation();
            viblio.api( '/services/mediafile/get', { mid: $(this).parent()[0].id, include_contact_info: 1 } ).then(function( json ){
                customDialogs.showShareVidModal( new Mediafile( json.media ) );
            });
        }
        
        function playVid(){
            router.navigate( 'new_player?mid=' + this.id );
        }
        
	// Create an array of Location objects to center the map
	// around those points.
	self.points.forEach( function( p ) {
            var m = self.map.addMarker( p.lat, p.lng, p );
            
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
                                        <div data-bind="liveEditor: title, ifnot: ro">\n\
                                            <div class="view vidTitle title truncate" data-bind="click: title.edit">' + p.title() + '</div>\n\
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
	router.navigate( 'new_player?mid=' + point.uuid );
    };

    return Map;
    
});


