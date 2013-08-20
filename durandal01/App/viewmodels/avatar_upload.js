define(['lib/viblio','plugins/router', 'plugins/dialog'], function( viblio, router, dialog ) {
    var Upload = function() {
    };
    Upload.prototype.dismiss = function() {
        var self = this;
	dialog.close(self);
    };
    Upload.prototype.submit = function() {
	var self = this;
	var data = $(self.view).find("form").serialize();
        console.log("Here is the upload data: " + data);
	/*viblio.api( '/services/user/add_or_replace_profile_photo', data ).then( function() {
	    dialog.close(self);
	});*/
    };
    Upload.prototype.attached = function( view ) {
	this.view = view;
    };
    return Upload;
});
