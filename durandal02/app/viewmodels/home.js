/*
  The channels page, which I think is the default page for an authenticated
  user.
*/
define(['durandal/app','durandal/system','viewmodels/hscroll','viewmodels/pscroll','viewmodels/mapstrip','lib/customDialogs'],function(app,system,HScroll,PScroll,MapStrip,customDialogs) {
    // A list of horizontal media display lists
    var strips = ko.observableArray([]);
    
    function hh(title, subtitle) {
        return system.defer( function( dfd ) {
            dfd.resolve( new HScroll(title, subtitle) );
        } ).promise();
    }

    function pp(title, subtitle) {
        return system.defer( function( dfd ) {
            dfd.resolve( new PScroll(title, subtitle) );
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
        activate: function () {
	    var self = this;
	    self.strips.removeAll();
	    return $.when( hh('Box Office Hits', 'Your most popular videos'), 
			   pp('Top Actors', 'Who\'s in your videos'),
			   mm()
			 ).then( function( h1, h2, h3 ) {
			     self.strips.push( h1 );
			     self.strips.push( h2 );
			     self.strips.push( h3 );
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
		customDialogs.hideLoading();
	    });
	}
    };

});
