
define(['plugins/dialog'], function(dialog) {

    var P = function() {
	this.p1 = ko.observable();
	this.p2 = ko.observable();
    };

    P.prototype.change = function() {
	var self = this;
	$(self.view).find(".mismatch").hide();
	if ( self.p1() != self.p2() ) {
	    $(self.view).find(".mismatch").show();
	}
	else {
	    // Have to do this here because of circular dependencies!
	    var viblio = require( "lib/viblio" );

	    viblio.api( '/services/user/change_password', { password: self.p1() } ).then(
		function() {
		    dialog.close( self );
		});
	}
    };

    P.prototype.dismiss = function() {
	dialog.close( this );
    };

    P.prototype.attached = function( view ) {
	this.view = view;
    };

    return P;
});
