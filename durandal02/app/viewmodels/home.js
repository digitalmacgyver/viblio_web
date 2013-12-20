/*
  The channels page, which I think is the default page for an authenticated
  user.
*/
define(['durandal/app','durandal/system','viewmodels/hscroll','viewmodels/pscroll','viewmodels/fscroll','lib/customDialogs'],function(app,system,HScroll,PScroll,FScroll,customDialogs) {
    // A list of horizontal media display lists
    var strips = ko.observableArray([]);

    var hits, actors, features, map;

    // to keep track whos sub-videos we're showing to make toggle work
    var showing_videos_for;
    
    function hh(title, subtitle, options) {
        return system.defer( function( dfd ) {
            dfd.resolve( new HScroll(title, subtitle, options) );
        } ).promise();
    }

    function pp(title, subtitle) {
        return system.defer( function( dfd ) {
            dfd.resolve( new PScroll(title, subtitle) );
        } ).promise();
    }

    function ff(title,subtitle) {
        return system.defer( function( dfd ) {
            dfd.resolve( new FScroll(title,subtitle) );
        } ).promise();
    }

    return {
        displayName: 'Channels',
        strips: strips,
        activate: function (args) {
	    var self = this;
	    self.strips.removeAll();

	    var advanced = false;
	    if ( args && args.advanced )
		advanced = true;

	    return $.when( hh('Recent Uploads', 'Your most recent videos', { advanced: advanced }), 
			   pp('People in your Videos', 'Click on a face to see videos of that person'),
			   ff('n Videos with Anonymous', '' )
			 ).then( function( h1, h2, h3 ) {
			     self.hits = h1;
			     self.actors = h2;
			     self.features = h3;
			     // When a face is selected, show the "features" strip and populate
			     // it with videos that this person is in
			     self.actors.on( 'pscroll:faceSelected', function( face, pos ) {
                                 var videoOrVideos = null;
                                 if(face.data.appears_in == 1) {
                                     videoOrVideos = "Video";
                                 } else {
                                     videoOrVideos = "Videos";
                                 }
				 if ( self.features.isvisible() && showing_videos_for == face.data.uuid ) {
				     self.features.hide();
				     self.actors.no_select();
				 }
				 else {
				     showing_videos_for = face.data.uuid; 
				     self.features.clear();
				     self.features.search( face.data.uuid );
				     self.features.setTitle( face.data.appears_in + ' ' + videoOrVideos +' with ' + face.data.contact_name );
				     self.features.show( pos );
				     var viblio = require( 'lib/viblio' );
				     viblio.mpEvent( 'videos_for_actor' );
				 }
			     });

			     self.strips.push( h1 );
			     self.strips.push( h2 );
			     self.strips.push( h3 );
			 });
        }
    };

});
