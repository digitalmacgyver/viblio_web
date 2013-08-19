
define(function() {

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
		    self.modal.close();
		});
	}
    };

    P.prototype.dismiss = function() {
	this.modal.close();
    };

    P.prototype.viewAttached = function( view ) {
	this.view = view;
    };

    return P;
});
