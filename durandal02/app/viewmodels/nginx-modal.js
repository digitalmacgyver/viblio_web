// This shim model allows the nginx upload page to be used as
// a modal popup.
//
define(['lib/viblio','lib/config','plugins/dialog'],function(viblio,config,dialog){
    return{
	close: function() {
	    var pending = $(this.view).find('.vup').viblio_uploader( 'in_progress' );
	    if ( pending ) {
		$(this.view).find('.vup').viblio_uploader( 
		    'alert',
		    'There are uploads in progress.  Please cancel them before closing this dialog.' );
		return false;
	    }
	    else {
		dialog.close( this );
		return true;
	    }
	},
	compositionComplete: function( view ) {
	    this.view = view;
	    $(view).find( '.vup' ).viblio_uploader({
		uuid: viblio.getUser().uuid,
		endpoint: '/files',
		done_message: 'Done; Processing...'
	    });
	    $(view).find('.vup-cancel-all')
		.addClass( 'btn')
		.addClass( 'btn-danger' );
            $(view).find('.vup-add-files')
		.addClass( 'btn')
		.addClass( 'btn-success' );
	    $(view).find('.vup-alert span').addClass('alert').addClass('alert-block').addClass('alert-error');

	    // This special modal needs to be wider and higher than the
	    // standard dialog ...
	    var w = $(window).width() * 0.8;
	    if ( w > 900 ) w = 900;
	    $(view).width( w );

	    var delta = ( $(window).width() - w ) / 2;

	    var ml = (($(window).width() / 2)-300)-(delta);

	    $(view).css( 'margin-left', '-' + ml + 'px' );
	    $(view).find(".closeX").css( 'right', '-' + ml + 'px' );

	    var available_height = $(window).height() - 200 - 40 - $(view).height();
	    if ( available_height < 250 ) available_height = 250;
	    $(view).find( ".vup-area").height( available_height );
	}
    };
});
