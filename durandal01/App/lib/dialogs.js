/* 
   Application wide dialogs.  For now, just use Durandal standard.
   Later we'll do different things like slide downs and such.
*/
define( ['durandal/app', 'durandal/system', 'durandal/modalDialog', 'viewmodels/incoming'], function( app, system, modalDialog, Incoming, Upload ) {
    var incoming = null;
    return {
	showMessage: function( msg, title, options ) {
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
	}
    };
});

