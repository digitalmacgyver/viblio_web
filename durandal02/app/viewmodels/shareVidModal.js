define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {
    
    var S = function( mediafile ) {
	var self = this;
	self.mediafile = mediafile;
	self.videoTitle = ko.computed(function() {
	    var title = self.mediafile.title();
	    title = title || 'My Viblio Video';
	    return encodeURIComponent( title );
	});
        self.private = ko.observable( 'private' );
        self.shareVidEmailValid = ko.observable(false);
	self.shareVidEmail = ko.observable();
	self.shareEmail_entry_error = ko.observable( false );
	
	self.shareVidMessage = ko.observable( $('#shareVidMessage').val() );
	self.shareMessage_entry_error = ko.observable( false );

	self.cut_and_paste_url = ko.observable();
	
	self.shareNetworks = [ { name: 'Facebook', addClass: 'fb', url: 'http://www.facebook.com/share.php?u=' + self.facebookLink(), imgName: 'FBf.png' }, 
                               { name: 'Twitter', addClass: 'twitter', url: 'https://twitter.com/share?url=' + self.twitterLink() + '&via=iviblio' + '&text=' + self.videoTitle().substring(0,130), imgName: 'twitter.png' }, 
                               { name: 'Google+', addClass: 'gPlus', url:'https://plusone.google.com/_/+1/confirm?hl=en&url=' + self.googleLink(), imgName: 'gPlus.png' },
                               { name: 'tumblr', addClass: 'tumblr', url:'http://www.tumblr.com/share/photo?' + self.tumblrLink(), imgName: 'tumblr.png' }
                             ];
    };
    
    S.prototype.cimport = function() {
	var viblio = require( 'lib/viblio' );
	viblio.mpEvent( 'address_book_import' );
	cloudsponge.launch({
	});
    };

    S.prototype.addPublicShare = function( self, network ) {
	var viblio = require( 'lib/viblio' );
	viblio.api( '/services/mediafile/add_share', { mid: self.mediafile.media().uuid } ).then( function() {
	    viblio.mpEvent( 'share', { type: 'public', network: network } );
            viblio.mpPeopleIncrement('Video Shares from Browser', 1);
	});
	return true; // let the href do its thing too!
    };

    S.prototype.facebookLink = function() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	// server = 'http://staging.viblio.com';
	return encodeURIComponent( server + '/s/p/' + this.mediafile.media().uuid );
    };

    S.prototype.twitterLink = function() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	// server = 'http://staging.viblio.com';
	return encodeURIComponent( server + '/s/p/' + this.mediafile.media().uuid );
    };

    S.prototype.googleLink = function() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	// server = 'http://staging.viblio.com';
	return encodeURIComponent( server + '/s/p/' + this.mediafile.media().uuid );
    };

    S.prototype.tumblrLink = function() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	// server = 'http://staging.viblio.com';

	var thumbnail = encodeURIComponent( server + '/s/ip/' + this.mediafile.media().views.poster.uri );
	var caption   = encodeURIComponent( 'Checkout my video on Viblio.com!' );
	var clickthru = encodeURIComponent( server + '/s/p/' + this.mediafile.media().uuid );

	return 'source=' + thumbnail + '&caption=' + caption + '&click_thru=' + clickthru;
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
	viblio.api( '/services/mediafile/add_share', 
		    { mid: self.mediafile.media().uuid, 
		      list: emails, 
		      body: message, 
		      private: self.private() } ).then( function() {
			  // log it to google analytics
			  viblio.mpEvent( 'share', { type: 'private' } );
                          viblio.mpPeopleIncrement('Video Shares from Browser', 1);
			  viblio.notify( 'Share email sent', 'success' );
		      });
	self.closeModal();
    };

    S.prototype.copyToClipboard = function() {
        system.log("Here is the shareLink: " + $('#shareLink').val());
    };

    S.prototype.attached = function( view, parent ) {
        $('.pop').click(function(){
            window.open($(this).attr('href'),'t','toolbar=0,resizable=1,status=0,width=640,height=528');
            return false;
        });
    };    

    S.prototype.deactivate = function() {
	// Remove flash object for copy-to-clipboard
	this.clip.destroy();
    };
        
    S.prototype.compositionComplete = function( view, parent ) {
        var self = this;
	self.view = view;
        cloudsponge.init({
            domain_key:config.cloudsponge_appid(),
            textarea_id: null,

	    sources: ['yahoo','gmail','windowslive','aol','plaxo' ],

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
        
	// This is the copy-to-clipboard support
	var viblio = require( 'lib/viblio' );

	ZeroClipboard.setMoviePath( 'lib/zeroclipboard/ZeroClipboard11.swf' );	
	self.clip = new ZeroClipboard.Client();
	self.clip.addEventListener( 'complete', function( client, text ) {
	    viblio.mpEvent( 'share', { type: 'hidden' } );
            viblio.mpPeopleIncrement('Video Shares from Browser', 1);
	});
	self.clip.setText( '' );
	self.clip.glue( 'copyShareLink', 'shareVidModal' );
	
	viblio.api( '/services/mediafile/add_share',
		    { mid: self.mediafile.media().uuid,
		      private: 'potential'
		    }).then( function( json ) {
			self.cut_and_paste_url( json.url );
			self.clip.setText( json.url );
		    });
    };

    return S;
});
