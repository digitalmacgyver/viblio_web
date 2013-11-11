define(['plugins/router'], function( router ) {
    
    var seeMac = ko.observable();
    var seePC = ko.observable();
    
    return {
        seeMac: seeMac,
        seePC: seePC,
        
        download_viblio: function() {
	    /*viblio.mpEvent( 'download_viblio' );
	    return true;*/
	}
    };
});
