/* 
   Application wide dialogs.  For now, just use Durandal standard.
   Later we'll do different things like slide downs and such.
*/
define( ['durandal/app', 
	 'durandal/system', 
	 'plugins/dialog', 
	 'viewmodels/loading', 
	 'viewmodels/change_password', 
	 'viewmodels/imap',
	 'viewmodels/shareVidModal', 
	 'viewmodels/shareAlbumModal',
         'viewmodels/shareNewAlbumModal',
	 'viewmodels/webPlayerError', 
	 'viewmodels/text_prompt'], 
function( app, system, dialog, Loading, ChangePassword, IMap, ShareVid, ShareAlbum, ShareNewAlbum, WebPlayerError, TextPrompt ) {
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
	    return dialog.showAnimated( new ChangePassword() );
	},
	showInteractiveMap: function( mediafile, options ) {
	    return app.showDialog( new IMap( mediafile, options ) );
	},
	showMagicTag: function( face ) {
	    return dialog.showAnimated( new MagicTag( face ) );
	},
	showContactCard: function( face ) {
	    return dialog.showAnimated( new ContactCard( face ) );
	},
	showShareVidModal: function( mediafile ) {
	    return dialog.showAnimated( new ShareVid( mediafile ) );
	},
	showShareAlbumModal: function( mediafile, args ) {
	    return dialog.showAnimated( new ShareAlbum( mediafile, args ) );
	},
        showShareNewAlbumModal: function( mediafile, args ) {
	    return dialog.showAnimated( new ShareNewAlbum( mediafile, args ) );
	},
	showWebPlayerError: function( title, message, err ) {
	    return dialog.showAnimated( new WebPlayerError( title, message, err ) );
	},
	showTextPrompt: function( msg, title, options ) {
	    return dialog.showAnimated( new TextPrompt( msg, title, options ) );
	}
    };
});

