define( function() {
    var Loading = function() {
	return this;
    };

    Loading.prototype.hide = function() {
	dialog.close(this);
    };

    return Loading;
});
