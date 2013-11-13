define(['plugins/router','lib/viblio'], function( router,viblio ) {
    
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

	activate: function( args ) {
	    if ( args && args.from )
		this.from = args.from;
	},
        
        download_viblio: function() {
	    var options = {};
	    if ( this.from ) 
		options.page = '/' + this.from;
	    viblio.mpEvent( 'download_viblio', options );
	    return true;
	}
    };
});
