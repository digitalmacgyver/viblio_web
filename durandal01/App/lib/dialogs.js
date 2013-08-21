/* 
   Application wide dialogs.  For now, just use Durandal standard.
   Later we'll do different things like slide downs and such.
*/
define( ['durandal/app', 'durandal/system', 'durandal/modalDialog', 'viewmodels/incoming', 'viewmodels/loading', 'viewmodels/change_password'], function( app, system, modalDialog, Incoming, Loading, ChangePassword ) {
    var incoming = null;
    var loading  = null;
    return {
	showMessage: function( msg, title, options ) {
	    return app.showMessage( msg, title, options );
	},
	showError: function( msg, title, options ) {
	    return app.showMessage( msg, title, options );
	},
	showWarning: function( msg, title, options ) {
	    return app.showMessage( msg, title, options );
	},
	showInfo: function( msg, title, options ) {
	    return app.showMessage( msg, title, options );
	},
	showModal: function( obj, activationData, context ) {
	    return app.showModal( obj, activationData, context );
	},
	showIncoming: function( messages ) {
	    // Incoming dialog is a little special.  If its already showing,
	    // we want to update the information on the screen.
	    if ( incoming ) {
		incoming.update( messages );
	    }
	    else {
		incoming = new Incoming( messages, function() { incoming = null; } );
		return modalDialog.show( incoming );
	    }
	},
	showLoading: function() {
	    if ( loading == null ) {
		loading = new Loading();
		return modalDialog.show( loading );
	    }
	},
	hideLoading: function() {
	    if ( loading ) 
		loading.modal.close();
	    loading = null;
	},
	showPassword: function() {
	    return modalDialog.show( new ChangePassword() );
	}
    };
});

