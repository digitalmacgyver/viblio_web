define(['plugins/router','lib/viblio'], function( router,viblio ) {
    
    var seeLearnMore = ko.observable(true);
    var seeInstructions = ko.observable(false);
    
    showLearnMore = function() {
        seeInstructions(false);
        seeLearnMore(true);
    };
    
    showInstructions = function() {
        seeLearnMore(false);
        seeInstructions(true);
    };
    
    toggleInfo = function() {
        if( seeLearnMore() ) {
            showInstructions();
        } else {
            showLearnMore();
        }
    }

    return {
        seeLearnMore: seeLearnMore,
        seeInstructions: seeInstructions,

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
