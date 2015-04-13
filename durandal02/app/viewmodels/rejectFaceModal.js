define(['lib/viblio',
        'lib/config',
        'plugins/dialog',
        'plugins/router'],
    function(viblio,config,dialog,router){
        
    var message = ko.observable();
    var p = ko.observable();
    
    var doNotShowAgain = ko.observable( false );
    doNotShowAgain.subscribe( function( val ) {
        var viblio = require( "lib/viblio" );
        
        if( val ) {
            viblio.setLocalStorage( 'rejectFace.doNotShowAgain', true );
        } else {
            viblio.setLocalStorage( 'rejectFace.doNotShowAgain', false );
        }
    });
    
    return{
        message: message,
        parent: p,
        
        doNotShowAgain: doNotShowAgain,
        
	close: function() {
            dialog.close( this );
	},
        
        selectOption: function( data ) {
            dialog.close( this, data );
        },
        
        /*activate: function( x ) {
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
        }*/
    };
});
