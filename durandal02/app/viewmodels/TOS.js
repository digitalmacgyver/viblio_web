define(['plugins/router'], function( router ) {
    
    var showTOS = ko.observable(true);
    var showPP = ko.observable(false);
    
    return {
        showTOS: showTOS,
        showPP: showPP,
        
        activate: function(args) {
            if (args && args.showTOS ) {
                this.showTOS(true);
                this.showPP(false);
            } else {
                this.showTOS(false);
                this.showPP(true);
            }
        }
    };
});
