/*
  The channels page, which I think is the default page for an authenticated
  user.
*/
define(['durandal/app','durandal/system','viewmodels/hscroll','viewmodels/pscroll','viewmodels/fscroll','viewmodels/mapstrip','lib/customDialogs'],function(app,system,HScroll,PScroll,FScroll,MapStrip,customDialogs) {
    // A list of horizontal media display lists
    var strips = ko.observableArray([]);

    var hits, actors, features, map;
    
    function hh(title, subtitle, advanced) {
        return system.defer( function( dfd ) {
            dfd.resolve( new HScroll(title, subtitle, advanced) );
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

	    return $.when( hh('Box Office Hits', 'Your most popular videos', advanced), 
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
				 self.features.clear();
				 self.features.search( face.data.id );
				 self.features.setTitle( face.data.appears_in + ' Videos with ' + face.data.contact_name );
				 self.features.show( pos );
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
		customDialogs.hideLoading();
	    });
	}
    };

});
