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
        
        setHeight: function() {
            var windowHeight = head.screen.innerHeight;
            $('.privacyMatters-Wrap').height( windowHeight - 300 );
        },
        
        compositionComplete: function() {
            var self = this;
            $('a').click(function(){
                self.close();
            });
            
            // set the height of the privacy matters modal content so it won't overflow the window
            //self.setHeight();
            
            //$(window).resize( this, self.setHeight );
        }/*,
        
        detached: function() {
            var self = this;
            
            $(window).off( "resize", self.setHeight );
        }*/
    };
});