define(['plugins/router', 'viewmodels/whoWeAre'], function( router, whoWeAre ) {
    
    var showWhat = ko.observable(true);
    var showWho = ko.observable(false);
    var showHow = ko.observable(false);
    
    return {
        whoWeAre: whoWeAre,
        
        showWhat: showWhat,
        showWho: showWho,
        showHow: showHow,
        
        activate: function(args) {
            if (args ) {
                if ( args.showWhat ) {
                    showWhat( true );
                    showWho( false );
                    showHow( false );
                } else if ( args.showWho ) {
                    showWhat( false );
                    showWho( true );
                    showHow( false );
                } else {
                    showWhat( false );
                    showWho( false );
                    showHow( true );
                }
            }
        }
    };
});
