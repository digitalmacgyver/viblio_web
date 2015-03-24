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
	 'viewmodels/shareVidModal2', 
	 'viewmodels/shareAlbumModal2',
         'viewmodels/shareNewAlbumModal',
	 'viewmodels/webPlayerError', 
	 'viewmodels/text_prompt',
         'viewmodels/rejectFaceModal'], 
function( app, system, dialog, Loading, ChangePassword, IMap, ShareVid, ShareAlbum, ShareNewAlbum, WebPlayerError, TextPrompt, RejectFace ) {
    var loading  = null;
    return {
	showMessage: function( msg, title, options ) {
	    // return app.showMessage( msg, title, options );
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new dialog.MessageBox( msg, title, options ) );
            }
	},
	showError: function( msg, title, options ) {
	    // return app.showMessage( msg, title, options );
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new dialog.MessageBox( msg, title, options ) );
            }
	},
	showWarning: function( msg, title, options ) {
	    // return app.showMessage( msg, title, options );
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new dialog.MessageBox( msg, title, options ) );
            }
	},
	showInfo: function( msg, title, options ) {
	    // return app.showMessage( msg, title, options );
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new dialog.MessageBox( msg, title, options ) );
            }
	},
	showModal: function( obj, activationData, context ) {
	    // return app.showDialog( obj, activationData, context );
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( obj, activationData );
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
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new ChangePassword() );
            }
	},
	showInteractiveMap: function( mediafile, options ) {
            if( !dialog.isOpen() ) {
                return app.showDialog( new IMap( mediafile, options ) );
            }
	},
	showMagicTag: function( face ) {
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new MagicTag( face ) );
            }
	},
	showContactCard: function( face ) {
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new ContactCard( face ) );
            }
	},
	showShareVidModal: function( mediafile ) {
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new ShareVid( mediafile ) );
            }
	},
	showShareAlbumModal: function( mediafile, args ) {
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new ShareAlbum( mediafile, args ) );
            }
	},
        showShareNewAlbumModal: function( mediafile, args ) {
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new ShareNewAlbum( mediafile, args ) );
            }
	},
	showWebPlayerError: function( title, message, err ) {
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new WebPlayerError( title, message, err ) );
            }
	},
	showTextPrompt: function( msg, title, options ) {
            if( !dialog.isOpen() ) {
                return dialog.showAnimated( new TextPrompt( msg, title, options ) );
            }
	}
    };
});

