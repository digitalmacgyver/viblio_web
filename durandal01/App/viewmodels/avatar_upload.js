define(['lib/viblio','durandal/plugins/router'], function( viblio, router ) {
    var Upload = function() {
    };
    Upload.prototype.dismiss = function() {
	this.modal.close();
    };
    Upload.prototype.submit = function() {
	var self = this;
	var data = $(self.view).find("form").serialize();
	viblio.api( '/services/user/add_or_replace_profile_photo', data ).then( function() {
	    self.modal.close();
	});
    };
    Upload.prototype.viewAttached = function( view ) {
	this.view = view;
    };
    return Upload;
});
