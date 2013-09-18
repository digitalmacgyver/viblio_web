define(['plugins/dialog'], function(dialog) {

    var IMap = function( mediafile, options ) {
	this.media   = mediafile;
	this.options = options;
    };

    IMap.prototype.dismiss = function() {
	dialog.close( this );
    };

    IMap.prototype.compositionComplete = function(view, parent) {
	var self = this;
	self.view = view;
	self.map  = $(self.view).find( ".map" ).vibliomap(self.options);
	self.map.centerDefault();
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
