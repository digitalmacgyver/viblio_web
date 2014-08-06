// This shim model allows the nginx upload page to be used as
// a modal popup.
//
define(['lib/viblio',
        'lib/config',
        'plugins/dialog',
        'durandal/events',
        'durandal/system',
        'plugins/router',
        'durandal/app'],
    function(viblio,config,dialog,Events,system,router,app){
        
    var firstUploadComplete = ko.observable();
    var firstUploadMessageHasBeenShown = ko.observable();
    var uploadsCompleted = ko.observable( null );
    
    Events.includeIn( this );
    
    function sendClosedMessage() {
        this.trigger( 'nginxModal:closed', this );
    }
    
    function sendClosedMessage2() {
        var args = {
            uploadsCompleted: uploadsCompleted()
        };
        
        app.trigger( 'nginxModal:closed2', args);
    }
    
    return{
        uploadsCompleted: uploadsCompleted,
        
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
                // only show ONCE after user's first upload in completed
                if ( firstUploadComplete() && !firstUploadMessageHasBeenShown() ) {
                    sendClosedMessage();
                    viblio.localStorage( 'firstUploadMessageHasBeenShown', true );
                }
                sendClosedMessage2();
		return true;
	    }  
	},
        activate: function() {
           // set uploadsCompleted to null 
           uploadsCompleted( null );
           // Check if first upload has been completed
           viblio.localStorage( 'firstUploadComplete' ).then(function( data ) {
                if ( data ) {
                    firstUploadComplete( true );
                } else {
                    firstUploadComplete( false );
                }
            });
            
            // Check if first Upload Message Has Been Shown
            viblio.localStorage( 'firstUploadMessageHasBeenShown' ).then(function( data ) {
                if ( data ) {
                    firstUploadMessageHasBeenShown( true );
                } else {
                    firstUploadMessageHasBeenShown( false );
                }
            });
        },
	compositionComplete: function( view ) {
            var self = this;
	    this.view = view;
	    $(view).find( '.vup' ).viblio_uploader({
		uuid: viblio.getUser().uuid,
		endpoint: '/files',
		done_message: 'Done; Processing...',
		alert_class: 'alert-error',
		notify_class: 'alert-success'
	    });

	    $(view).find( '.vup' ).bind( 'viblio_uploaderstarted', function() {
		viblio.mpEvent( 'ui_upload_started' );
                viblio.mpPeopleIncrement( 'UI uploads started' );
                viblio.mpPeopleSet({'Last Video Upload Date': new Date() });
	    });
                        
	    $(view).find( '.vup' ).bind( 'viblio_uploadercompleted', function() {
                viblio.mpEvent( 'ui_upload_complete' );
                viblio.mpPeopleIncrement( 'UI uploads completed' );
                self.uploadsCompleted( true );
	    });
            
            //After first successful upload mark 'firstUploadComplete' as true 
            $(view).find( '.vup' ).bind( 'viblio_uploaderfinished', function() {
                if( !firstUploadMessageHasBeenShown() ) {
                    firstUploadComplete( true );
                }
		viblio.localStorage( 'firstUploadComplete', true );
	    });
            
            $(view).find( '.vup' ).bind( 'viblio_uploaderclose', function() {
                self.close();
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
