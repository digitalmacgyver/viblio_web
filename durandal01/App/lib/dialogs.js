/* 
   Application wide dialogs.  For now, just use Durandal standard.
   Later we'll do different things like slide downs and such.
*/
define( ['durandal/app', 'durandal/system' ], function( app, system ) {
    return {
	showMessage: function( msg, title, options ) {
	    return app.showMessage( msg, title, options );
	},
	showModal: function( obj, activationData, context ) {
	    return app.showModal( obj, activationData, context );
	}
    };
});

