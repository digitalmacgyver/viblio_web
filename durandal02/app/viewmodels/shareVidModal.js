define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook', 'cloudsponge'], function( router, app, system, config, viblio, dialog ) {
    
    var S = function( mediafile ) {
	var self = this;
	self.mediafile = mediafile;
	self.shareTitle = ko.computed(function() {
            return encodeURIComponent( $(document).attr('title') );
	});
        self.private = ko.observable( 'private' );
        self.shareVidEmailValid = ko.observable(false);
	self.shareVidEmail = ko.observable();
	self.shareEmail_entry_error = ko.observable( false );
	
	self.shareVidMessage = ko.observable( null );
	self.shareMessage_entry_error = ko.observable( false );
	
	self.shareNetworks = [ { name: 'Facebook', addClass: 'fb', url: 'http://www.facebook.com/share.php?u=' + self.facebookLink(), imgName: 'FBf.png' }, 
                               { name: 'Twitter', addClass: 'twitter', url: 'https://twitter.com/share?url=' + self.twitterLink() + '&text=' + self.shareTitle().substring(0,130), imgName: 'twitter.png' }, 
                               { name: 'Google+', addClass: 'gPlus', url:'https://plusone.google.com/_/+1/confirm?hl=en&url=' + self.googleLink(), imgName: 'gPlus.png' },
                               { name: 'tumblr', addClass: 'tumblr', url:'http://www.tumblr.com/share/photo?' + self.tumblrLink(), imgName: 'tumblr.png' }
                             ];
    };
    
    S.prototype.cimport = function() {
	cloudsponge.launch({
	});
    };

    S.prototype.addPublicShare = function( self, network ) {
	var viblio = require( 'lib/viblio' );
	viblio.api( '/services/mediafile/add_share', { mid: self.mediafile.media().uuid } ).then( function() {
	    // log it to google analytics
	    viblio.gaSocial( network.toLowerCase(), 'share', self.mediafile.media().uuid );
	    viblio.gaEvent(  network.toLowerCase(), 'share', 'social' );
	});
	return true; // let the href do its thing too!
    };

    S.prototype.facebookLink = function() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	server = 'http://staging.viblio.com';
	return encodeURIComponent( server + '/shared/flowplayer/' + this.mediafile.media().uuid );
    };

    S.prototype.twitterLink = function() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	server = 'http://staging.viblio.com';
	return encodeURIComponent( server + '/shared/flowplayer/' + this.mediafile.media().uuid );
    };

    S.prototype.googleLink = function() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	server = 'http://staging.viblio.com';
	return encodeURIComponent( server + '/shared/flowplayer/' + this.mediafile.media().uuid );
    };

    S.prototype.tumblrLink = function() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	server = 'http://staging.viblio.com';

	var thumbnail = encodeURIComponent( server + '/shared/s3_image_proxy/' + this.mediafile.media().views.poster.uri );
	var caption   = encodeURIComponent( 'Checkout my video on Viblio.com!' );
	var clickthru = encodeURIComponent( server + '/shared/flowplayer/' + this.mediafile.media().uuid );

	return 'source=' + thumbnail + '&caption=' + caption + '&click_thru=' + clickthru;
    };

    S.prototype.closeModal = function() {
        dialog.close(this);
    };
    
    S.prototype.emailLink = function() {
        var self = this;
        
        // TODO - Add the real url that should be added as a placeholder
        if( self.shareVidMessage() == null ) {
            $('#shareVidMessage').val( $('#shareVidMessage').attr('placeholder') );
        };
        
	var message = $('#shareVidMessage').val();
	var list    = $( "#shareVidEmail" ).val();
	var viblio = require( 'lib/viblio' );
	viblio.api( '/services/mediafile/add_share', 
		    { mid: self.mediafile.media().uuid, 
		      list: list, 
		      body: message, 
		      private: self.private() } ).then( function() {
			  // log it to google analytics
			  viblio.gaSocial( self.private(), 'share', self.mediafile.media().uuid );
			  viblio.gaEvent(  self.private(), 'share', 'social' );
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
        
    S.prototype.compositionComplete = function( view, parent ) {
        var self = this;
        cloudsponge.init({
            domain_key:config.cloudsponge_appid(),
            textarea_id: null,
            afterSubmitContacts: function( contacts, source, owner ) {
                contacts.forEach( function( c ) {
                    $(view).find( "#shareVidEmail" ).tokenInput( "add", {
                        id: c.selectedEmail(), 
                        name: c.first_name });
                });
            }
        });

        $(view).find( "#shareVidEmail" ).tokenInput( 
            '/services/faces/contact_emails',
            { minChars: 2,
              theme: "facebook",
              preventDuplicates: true,
              onAdd: function() {
                  self.shareVidEmailValid(true);
              },
              resultsFormatter: function( item ) {
                  return '<li>' + item.name + '&nbsp;(' + item.id + ')</li>';
              }
            });
        
    };

    return S;
});
