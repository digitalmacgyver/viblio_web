define( ['plugins/router', 
	 'durandal/app', 
	 'durandal/system', 
	 'lib/config', 
	 'lib/viblio', 
	 'plugins/dialog' ],

function( router, app, system, config, viblio, dialog ) {
    
    var S = function( mediafile ) {
	var self = this;
	self.mediafile = mediafile;
	self.videoTitle = ko.computed(function() {
	    var title = self.mediafile.albumTitle();
	    title = title || 'My Viblio Album';
	    return encodeURIComponent( title );
	});
        self.private = ko.observable( 'private' );
        self.shareVidEmailValid = ko.observable(false);
	self.shareVidEmail = ko.observable();
	self.shareEmail_entry_error = ko.observable( false );
	
	self.shareVidMessage = ko.observable( $('#shareVidMessage').val() );
	self.shareMessage_entry_error = ko.observable( false );
    };
    
    S.prototype.cimport = function() {
	var viblio = require( 'lib/viblio' );
	viblio.mpEvent( 'address_book_import' );
	cloudsponge.launch({
	});
    };

    S.prototype.closeModal = function() {
        dialog.close(this);
    };
    
    S.prototype.updateMessage = function() {
        var self = this;
        if( self.shareVidMessage() == null ) {
            $('#shareVidMessage').val( $('#shareVidMessage').attr('placeholder') );
        };
    };
    
    S.prototype.emailLink = function() {
        var self = this;
        
        // TODO - Add the real url that should be added as a placeholder
        if( self.shareVidMessage() == null ) {
            $('#shareVidMessage').val( $('#shareVidMessage').attr('placeholder') );
        };
        
	var message = $('#shareVidMessage').val();
	var list = $(self.view).find( "#shareVidEmail" ).tokenInput("get");
	var emails = [];
	list.forEach( function( email ) {
	    emails.push( email.id || email.name );
	});
	var viblio = require( 'lib/viblio' );
	viblio.api( '/services/album/share_album', 
		    { aid: self.mediafile.media().uuid, 
		      members: emails, 
		      body: message } ).then( function() {
			  // log it to google analytics
			  viblio.mpEvent( 'share', { type: 'album' } );
			  viblio.notify( 'Share email sent', 'success' );
		      });
	self.closeModal();
    };

    S.prototype.attached = function( view, parent ) {
        $('.pop').click(function(){
            window.open($(this).attr('href'),'t','toolbar=0,resizable=1,status=0,width=640,height=528');
            return false;
        });
    };    

    S.prototype.deactivate = function() {
    };
        
    S.prototype.compositionComplete = function( view, parent ) {
        var self = this;
	self.view = view;
        cloudsponge.init({
            domain_key:config.cloudsponge_appid(),
            textarea_id: null,

	    selectionLimit: 20,  // limit the number of contacts that can be selected
	    selectionLimitMessage: 'To prevent spam detection, please select 20 or less contacts at one time',
	    displaySelectAllNone: false, // do not show the select all/nune links

            afterSubmitContacts: function( contacts, source, owner ) {
                contacts.forEach( function( c ) {
                    $(view).find( "#shareVidEmail" ).tokenInput( "add", {
                        id: c.selectedEmail(), 
                        name: c.first_name });
                });
            }
        });
        
        // Sets up placeholder compatability for IE when needed
        $('input, textarea').placeholder();

        $(view).find( "#shareVidEmail" ).tokenInput( 
            '/services/faces/contact_emails',
            { minChars: 2,
              theme: "facebook",
              preventDuplicates: true,
              onAdd: function() {
                  self.shareVidEmailValid(true);
              },
              resultsFormatter: function( item ) {
                  return '<li>' + item.name + '&nbsp;(' + (item.id || item.name) + ')</li>';
              }
            });
    };

    return S;
});
