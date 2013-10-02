define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {
    
    var S = function( mediafile ) {
	var self = this;
	self.mediafile = mediafile;
	self.shareTitle = ko.computed(function() {
            return encodeURIComponent( $(document).attr('title') );
	});
	self.shareVidEmail = ko.observable();
	self.shareEmail_entry_error = ko.observable( false );
	
	self.shareVidMessage = ko.observable();
	self.shareMessage_entry_error = ko.observable( false );
	
	self.shareNetworks = [ { name: 'Facebook', addClass: 'fb', url: 'http://www.facebook.com/share.php?u=' + self.facebookLink(), imgName: 'FBf.png' }, 
                               { name: 'Twitter', addClass: 'twitter', url: 'https://twitter.com/share?url=' + self.twitterLink() + '&text=' + self.shareTitle().substring(0,130), imgName: 'twitter.png' }, 
                               { name: 'Google+', addClass: 'gPlus', url:'https://plusone.google.com/_/+1/confirm?hl=en&url=' + self.googleLink(), imgName: 'gPlus.png' },
                               { name: 'tumblr', addClass: 'tumblr', url:'http://www.tumblr.com/share?v=3&u=' + self.tumblrLink(), imgName: 'tumblr.png' }
                             ];
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
	return encodeURIComponent( server + '/shared/flowplayer/' + this.mediafile.media().uuid );
    };

    S.prototype.closeModal = function() {
        dialog.close(this);
    };
    
    S.prototype.emailLink = function() {
        dialog.showMessage('add email vid func');
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

    return S;
});
