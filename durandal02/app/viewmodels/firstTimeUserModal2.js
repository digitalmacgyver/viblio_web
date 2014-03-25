define(['plugins/dialog','lib/customDialogs'],function(dialog,dialogs){    

    return{
	close: function() {
            dialog.close( this );
            dialogs.showModal( 'viewmodels/nginx-modal' );
	}
    };
});
