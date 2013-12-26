define([ 'plugins/router', 'plugins/dialog' ], function( router, dialog ) {

    var D = function( title, message, errorHash ) {
	var self = this;
	var viblio = require( 'lib/viblio' );

	self.title     = ko.observable( title );
	self.message   = ko.observable( message );
	self.errorHash = ko.observable( errorHash );
	self.loggedIn  = ko.observable( viblio.user() && viblio.user().uuid );
    };

    D.prototype.close = function() {
	dialog.close( this );
	return true;
    };

    return D;
});
