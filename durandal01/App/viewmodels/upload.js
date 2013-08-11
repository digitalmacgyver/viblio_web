define( ['lib/dialogs'], function(dialogs) {
    return {
	displayName: 'Media Upload',
	message: function() {
	    dialogs.showMessage( 'This is a body', 'Title' );
	}
    };
});
