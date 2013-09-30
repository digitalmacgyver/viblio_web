define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {
    
    var shareURL = ko.computed(function() {
        return encodeURIComponent( $(location).attr('href') );
    });
    
    var shareTitle = ko.computed(function() {
        return encodeURIComponent( $(document).attr('title') );
    });
    
    var shareNetworks = [ { name: 'Facebook', addClass: 'fb', url: 'http://www.facebook.com/share.php?u=' + shareURL(), imgName: 'FBf.png' }, 
                          { name: 'Twitter', addClass: 'twitter', url: 'https://twitter.com/share?url=' + shareURL() + '&text=' + shareTitle().substring(0,130), imgName: 'twitter.png' }, 
                          { name: 'Google+', addClass: 'gPlus', url:'https://plusone.google.com/_/+1/confirm?hl=en&url=' + shareURL(), imgName: 'gPlus.png' },
                          { name: 'tumblr', addClass: 'tumblr', url:'http://www.tumblr.com/share?v=3&u=' + shareURL(), imgName: 'tumblr.png' }
                        ];
    
    var shareVidEmail = ko.observable();
    var shareEmail_entry_error = ko.observable( false );

    var shareVidMessage = ko.observable();
    var shareMessage_entry_error = ko.observable( false );

    fb_appid   = config.facebook_appid();
    fb_channel = config.facebook_channel();

    FB.init({
	appId: fb_appid,
	channelUrl: fb_channel,
	status: true,
	cookie: true,
	xfbml: true
    });
    
    function closeModal() {
        dialog.close(this);
    }
    
    function showShareVidModal() {
        dialog.show('viewmodels/shareVidModal');
    };
    
    function emailLink() {
        dialog.showMessage('add email vid func');
    };

    function copyToClipboard() {
        system.log("Here is the shareLink: " + $('#shareLink').val());
    };

    return {
        shareURL: shareURL,
        shareNetworks: shareNetworks,        
	shareVidEmail: shareVidEmail,
	shareEmail_entry_error: shareEmail_entry_error,

	shareVidMessage: shareVidMessage,
	shareMessage_entry_error: shareMessage_entry_error,
        
        closeModal: closeModal,
        showShareVidModal: showShareVidModal,
        emailLink: emailLink,
        copyToClipboard: copyToClipboard,
        
        attached: function( view, parent ) {
            
            $('.pop').click(function(){
                window.open($(this).attr('href'),'t','toolbar=0,resizable=1,status=0,width=640,height=528');
                return false;
            });
        }
        
    };
});
