/*
  The channels page, which I think is the default page for an authenticated
  user.
*/
define(['durandal/app','durandal/system','viewmodels/hscroll','lib/customDialogs'],function(app,system,HScroll,customDialogs) {
    // A list of horizontal media display lists
    var strips = ko.observableArray([]);
    
    function ii(title, subtitle) {
        return system.defer( function( dfd ) {
            dfd.resolve( new HScroll(title, subtitle) );
        } ).promise();
    }

    return {
        displayName: 'Channels',
        strips: strips,
        activate: function () {
	    var self = this;
	    self.strips.removeAll();
	    return $.when( ii('All Media', 'Everything there is...'), ii('Favs', 'You took em!') ).then( function( h1, h2 ) {
		self.strips.push( h1 );
		self.strips.push( h2 );
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
