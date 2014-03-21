// This shim model allows the nginx upload page to be used as
// a modal popup.
//
define(['lib/viblio','lib/config','plugins/dialog','durandal/events'],function(viblio,config,dialog,Events){
    
    var firstTime = ko.observable();
    var firstUpload = ko.observable();
    
    Events.includeIn( this );
    
    function sendClosedMessage() {
        this.trigger( 'nginxModal:closed', this );
    }
    
    return{
        firstTime: firstTime,
        
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
                // only show after user's first upload in completed
                if ( firstUpload() ) {
                    sendClosedMessage();
                }
		return true;
	    }  
	},
        activate: function() {
            // check if this is user's first visit
            viblio.localStorage( 'hasUserBeenHereBefore' ).then(function( data ) {
                console.log( data );
                if ( data.hasUserBeenHereBefore ) {
                    firstTime( false );
                } else {
                    firstTime( true );
                    $('.web-uploader-header-button').popover('show');
                }
            });
            // Check if first upload
            viblio.localStorage( 'hasUserUploadedBefore' ).then(function( data ) {
                console.log( data );
                if ( data.hasUserUploadedBefore ) {
                    firstUpload( false );
                } else {
                    firstUpload( true );
                }
            });
        },
	compositionComplete: function( view ) {
	    this.view = view;
	    $(view).find( '.vup' ).viblio_uploader({
		uuid: viblio.getUser().uuid,
		endpoint: '/files',
		done_message: 'Done; Processing...',
		alert_class: 'alert-error',
		notify_class: 'alert-success'
	    });
	    $(view).find('.vup-cancel-all')
		.addClass( 'btn')
		.addClass( 'btn-danger' );
            $(view).find('.vup-add-files')
		.addClass( 'btn')
		.addClass( 'btn-success' );
	    $(view).find('.vup-alert span').addClass('alert').addClass('alert-block');

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
