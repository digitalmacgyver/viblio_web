define(['lib/viblio','lib/config','plugins/dialog','plugins/router'],function(viblio,config,dialog,router){
    var message = ko.observable();
    var p = ko.observable();
    
    return{
        message: message,
        parent: p,
        
	close: function() {
            dialog.close( this );
	},
        
        activate: function( x ) {
            if( x.msg ) {
                message( x.msg );
                p( x.parent );
            } else {
                message( x );
            }
        },
        
        compositionComplete: function() {
            var self = this;
            $('a').click(function(){
                self.close();
            });
            
            $('.closeParent').on('click', function(e) {
                dialog.close( p() );
            });
        }
    };
});
