define(['lib/viblio','lib/config','plugins/dialog','plugins/router'],function(viblio,config,dialog,router){
    var message = ko.observable();
    
    return{
        message: message,
        
	close: function() {
            dialog.close( this );
	},
        
        activate: function( x ) {
            message( x );
        },
        
        compositionComplete: function() {
            var self = this;
            $('a').click(function(){
                self.close();
            });
        }
    };
});
