define(['lib/viblio','lib/config','plugins/dialog','plugins/router', 'durandal/events'],function(viblio,config,dialog,router,Events){    
    
    Events.includeIn( this );
    
    function sendClosedMessage() {
        this.trigger( 'firstTimeUserModal:closed', this );
    }
    
    return{
	close: function() {
            sendClosedMessage();
            dialog.close( this );
	}
    };
});
