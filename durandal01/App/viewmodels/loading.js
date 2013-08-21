define( function() {
    var Loading = function() {
	return this;
    };

    Loading.prototype.hide = function() {
	this.modal.close();
    };

    return Loading;
});
