/* 
   Application wide dialogs.  For now, just use Durandal standard.
   Later we'll do different things like slide downs and such.
*/
define( ['durandal/app', 'durandal/system', 'plugins/dialog', 'viewmodels/loading', 'viewmodels/change_password', 'viewmodels/imap','viewmodels/shareVidModal', 'viewmodels/webPlayerError'], function( app, system, dialog, Loading, ChangePassword, IMap, ShareVid, WebPlayerError ) {
    var loading  = null;
    return {
	showMessage: function( msg, title, options ) {
	    // return app.showMessage( msg, title, options );
	    return dialog.showAnimated( new dialog.MessageBox( msg, title, options ) );
	},
	showError: function( msg, title, options ) {
	    // return app.showMessage( msg, title, options );
	    return dialog.showAnimated( new dialog.MessageBox( msg, title, options ) );
	},
	showWarning: function( msg, title, options ) {
	    // return app.showMessage( msg, title, options );
	    return dialog.showAnimated( new dialog.MessageBox( msg, title, options ) );
	},
	showInfo: function( msg, title, options ) {
	    // return app.showMessage( msg, title, options );
	    return dialog.showAnimated( new dialog.MessageBox( msg, title, options ) );
	},
	showModal: function( obj, activationData, context ) {
	    // return app.showDialog( obj, activationData, context );
	    return dialog.showAnimated( obj, activationData );
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
	    // return app.showDialog( new ChangePassword() );
	    return dialog.showAnimated( new ChangePassword() );
	},
	showInteractiveMap: function( mediafile, options ) {
	    return app.showDialog( new IMap( mediafile, options ) );
	},
	showMagicTag: function( face ) {
	    // return app.showDialog( new MagicTag( face ) );
	    return dialog.showAnimated( new MagicTag( face ) );
	},
	showContactCard: function( face ) {
	    // return app.showDialog( new ContactCard( face ) );
	    return dialog.showAnimated( new ContactCard( face ) );
	},
	showShareVidModal: function( mediafile ) {
            // return app.showDialog( new ShareVid( mediafile ) );
	    return dialog.showAnimated( new ShareVid( mediafile ) );
	},
	showWebPlayerError: function( title, message, err ) {
	    return dialog.showAnimated( new WebPlayerError( title, message, err ) );
	}
    };
});

