/* 
   Application wide dialogs.  For now, just use Durandal standard.
   Later we'll do different things like slide downs and such.
*/
define( ['durandal/app', 'durandal/system', 'plugins/dialog', 'viewmodels/incoming', 'viewmodels/loading', 'viewmodels/change_password', 'viewmodels/imap','viewmodels/magictag','viewmodels/contactcard'], function( app, system, dialog, Incoming, Loading, ChangePassword, IMap, MagicTag, ContactCard ) {
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
	    return app.showDialog( obj, activationData, context );
	},
	showIncoming: function( messages ) {
	    // Incoming dialog is a little special.  If its already showing,
	    // we want to update the information on the screen.
	    if ( incoming ) {
		incoming.update( messages );
	    }
	    else {
		incoming = new Incoming( messages, function() { incoming = null; } );
		return app.showDialog( incoming );
	    }
	},
	showLoading: function() {
	    if ( loading == null ) {
		loading = new Loading();
		return app.showDialog( loading );
	    }
	},
	hideLoading: function() {
	    if ( loading ) 
                dialog.close( loading );
	    loading = null;
	},
	showPassword: function() {
	    return app.showDialog( new ChangePassword() );
	},
	showInteractiveMap: function( mediafile, options ) {
	    return app.showDialog( new IMap( mediafile, options ) );
	},
	showMagicTag: function( face ) {
	    return app.showDialog( new MagicTag( face ) );
	},
	showContactCard: function( face ) {
	    return app.showDialog( new ContactCard( face ) );
	}
    };
});

