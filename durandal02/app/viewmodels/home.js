/*
  The channels page, which I think is the default page for an authenticated
  user.
*/
define(['durandal/app','durandal/system','viewmodels/hscroll','viewmodels/pscroll','viewmodels/fscroll','viewmodels/mapstrip','lib/customDialogs'],function(app,system,HScroll,PScroll,FScroll,MapStrip,customDialogs) {
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

    function mm() {
        return system.defer( function( dfd ) {
            dfd.resolve( new MapStrip() );
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
			   pp('Top Actors', 'Who\'s who in your videos'),
			   ff('n Videos with Anonymous', '' ),
			   mm()
			 ).then( function( h1, h2, h3, h4 ) {
			     self.hits = h1;
			     self.actors = h2;
			     self.features = h3;
			     self.map = h4;

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
			     self.strips.push( h4 );
			 });
        },
	attached: function() {
	    return system.defer( function( dfd ) {
		customDialogs.showLoading();
		dfd.resolve();
	    }).promise();
	},
	compositionComplete: function( view, parent ) {
	    var self = this;
	    system.wait(1).then( function() {
		self.strips()[0].ready( view, parent );
		self.strips()[1].ready( view, parent );
		self.strips()[2].ready( view, parent );
		self.map.resize();
		customDialogs.hideLoading();
	    });
	}
    };

});
