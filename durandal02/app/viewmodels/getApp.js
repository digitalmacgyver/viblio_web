define(['plugins/router'], function( router ) {
    
     var seeMac = ko.observable(false);
    var seePC = ko.observable(false);
    
    showMac = function() {
        seePC(false);
        seeMac(true);
    };
    
    showPC = function() {
        seeMac(false);
        seePC(true);
    };
    
    return {
        seeMac: seeMac,
        seePC: seePC,
        
        download_viblio: function() {
	    /*viblio.mpEvent( 'download_viblio' );*/
	    return true;
	}
    };
});
