define( ['plugins/dialog'], 
function(dialog ) {
    
    var S = function() {
	var self = this;
    };
    
    S.prototype.closeModal = function() {
        dialog.close(this);
    };
    
    return S;
});
