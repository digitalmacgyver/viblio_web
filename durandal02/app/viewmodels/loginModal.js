define(['lib/viblio','lib/config','plugins/dialog','plugins/router'],function(viblio,config,dialog,router){
    var message = ko.observable();
    
    return{
        message: message,
        
	close: function() {
            dialog.close( this );
	},
	 login: function() {
             dialog.close( this );
             router.navigate('#login');
         },
         activate: function( x ) {
            message( x );
         }
    };
});
