/* 
   Application wide dialogs.  For now, just use Durandal standard.
   Later we'll do different things like slide downs and such.
*/
define( ['durandal/app', 'durandal/system', 'durandal/modalDialog', 'viewmodels/incoming' ], function( app, system, modalDialog, Incoming ) {
    return {
	showMessage: function( msg, title, options ) {
	    return app.showMessage( msg, title, options );
	},
	showModal: function( obj, activationData, context ) {
	    return app.showModal( obj, activationData, context );
	},
	showIncoming: function( messages ) {
	    return modalDialog.show( new Incoming( messages ) );
	},
    };
});

