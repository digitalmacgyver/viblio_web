define(['lib/viblio','lib/config','plugins/dialog','plugins/router', 'durandal/events'],function(viblio,config,dialog,router,Events){
    
    return{
	close: function() {
            viblio.localStorage( 'hasUserUploadedBefore', true );
            dialog.close( this );
	}
    };
});
