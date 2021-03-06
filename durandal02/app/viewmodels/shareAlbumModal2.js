define( ['plugins/router', 
	 'durandal/app', 
	 'durandal/system', 
	 'lib/config', 
	 'lib/viblio', 
	 'plugins/dialog' ],

function( router, app, system, config, viblio, dialog ) {
    
    var S = function( album, args ) {
	var self = this;
	self.album = album;
	self.is_shared = ko.observable( self.album.is_shared ? true: false );
	self.shared_with = ko.observable();
	self.members = ko.observableArray([]);
	self.albumTitle = ko.observable( null );
        self.private = ko.observable( 'private' );
        self.shareVidEmailValid = ko.observable(false);
	self.shareVidEmail = ko.observable();
	self.shareEmail_entry_error = ko.observable( false );
	
	self.shareVidMessage = ko.observable( $('#shareVidMessage').val() );
	self.shareMessage_entry_error = ko.observable( false );
        self.showEmailSection = ko.observable( true );
        if ( args && args.showEmailSection == false ) {
            self.showEmailSection( false );
        }
    };
    
    S.prototype.getName = function() {
        var viblio = require( 'lib/viblio' );
        return viblio.user().displayname;
    };
    
    S.prototype.getAvatar = function() {
        var viblio = require( 'lib/viblio' );
        //return viblio.user().displayname;
    };
    
    S.prototype.cimport = function() {
	var viblio = require( 'lib/viblio' );
	viblio.mpEvent( 'address_book_import' );
    };

    S.prototype.closeModal = function() {
        $('.token-input-dropdown-facebook').hide();
        dialog.close(this, this);
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
        if( emails.length > 0 ) {
            viblio.api( '/services/album/share_album', 
		    { aid: self.album.uuid, 
		      members: emails, 
		      body: message } ).then( function() {
			  // log it to google analytics
			  self.is_shared( true );
			  viblio.mpEvent( 'share', { type: 'album' } );
			  viblio.notify( 'Share email sent', 'success' );
                          // broadcast that album has been shared along with aid so new members can be shown in viewAlbum
                          app.trigger('album:album_shared', self.album.uuid);
		      });
            self.closeModal();
        }
    };

    S.prototype.attached = function( view, parent ) {
        $('.pop').click(function(){
            window.open($(this).attr('href'),'t','toolbar=0,resizable=1,status=0,width=640,height=528');
            return false;
        });
    };    

    S.prototype.deactivate = function() {
    };

    S.prototype.remove_member = function(a,b) {
	$(b.target).parent().find( '.remove-member-confirm' ).css( 'display', 'inline' );
    };
    
    S.prototype.unshareAlbum = function(data) {
        var self = this;
        var viblio = require( 'lib/viblio' );
        viblio.api( '/services/album/delete_shared_album', { aid: data.uuid } ).then( function() {
            app.trigger('album:album_unshared', data.uuid);
            self.closeModal();
        });
    };
        
    S.prototype.yes_remove = function(a,b) {
	var self = this;
	var viblio = require( 'lib/viblio' );
	viblio.api( '/services/album/remove_members_from_shared',
		    { aid: self.album.uuid,
		      members: [ a.contact_email ] } )
	    .then( function() {
		self.members.remove( a );
		if ( self.members().length == 0 ) {
		    self.is_shared( false );
                    self.unshareAlbum( self.album );
                }
	    });
    };
        
    S.prototype.no_remove = function(a,b) {
	$(b.target).parent().css( 'display', 'none' );
    };
    
    S.prototype.activate = function( view, parent ) {
        var self = this;
        var viblio = require( 'lib/viblio' );
        self.albumTitle( '"' + viblio.unescapeHtml( self.album.title ) + '"' );
    };
    
    S.prototype.compositionComplete = function( view, parent ) {
        var self = this;
	self.view = view;
	// If this album is a shared album, then obtain the current
	// members for display
	if ( self.is_shared() ) {
	    var viblio = require( 'lib/viblio' );
	    viblio.api( '/services/album/shared_with', { aid: self.album.uuid } ).then( function( data ) {
		var displayname = data.displayname;
		var members = data.members;
		self.shared_with( displayname );
		self.members( members );
	    });
	}
        
        // Sets up placeholder compatability for IE when needed
        $('input, textarea').placeholder();

        $(view).find( "#shareVidEmail" ).tokenInput( 
            '/services/faces/contact_emails',
            { minChars: 2,
              theme: "facebook",
              preventDuplicates: true,
              //hintText: 'Place holder text...',
              onAdd: function() {
                  self.shareVidEmailValid(true);
              },
              onDelete: function() {
                  var list = $(self.view).find( "#shareVidEmail" ).tokenInput("get");
                  if( list.length == 0 ) {
                    self.shareVidEmailValid(false);
                  }
              },
              resultsFormatter: function( item ) {
                  return '<li>' + item.name + '&nbsp;(' + (item.id || item.name) + ')</li>';
              }
        });
        
        $("#token-input-shareVidEmail").attr("placeholder", "Email");
    };

    return S;
});
