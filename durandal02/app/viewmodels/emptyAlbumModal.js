define(['lib/viblio','lib/config','plugins/dialog','plugins/router'],function(viblio,config,dialog,router){
    function sendResult( res ) {
        dialog.close( this, res );
    }
    
    return {
        sendResult: sendResult
    };
});
