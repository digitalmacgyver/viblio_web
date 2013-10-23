define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {
    
    var shareTitle = ko.computed(function() {
        return encodeURIComponent( 'Enroll in the private Viblio Beta now!' );
    });
    
    var shareNetworks = [ { name: 'Facebook', addClass: 'fb', url: 'http://www.facebook.com/share.php?u=' + facebookLink(), imgName: 'FBf.png' }, 
                          { name: 'Twitter', addClass: 'twitter', url: 'https://twitter.com/share?url=' + twitterLink() + '&text=' + shareTitle().substring(0,130), imgName: 'twitter.png' }, 
                          { name: 'Google+', addClass: 'gPlus', url:'https://plusone.google.com/_/+1/confirm?hl=en&url=' + googleLink(), imgName: 'gPlus.png' },
                          { name: 'tumblr', addClass: 'tumblr', url:'http://www.tumblr.com/share/photo?' + tumblrLink(), imgName: 'tumblr.png' }
                        ];
    
    function facebookLink() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	// server = 'http://staging.viblio.com';
	return encodeURIComponent( server + '/s/x' );
    }

    function twitterLink() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	// server = 'http://staging.viblio.com';
	return encodeURIComponent( server + '/s/x' );
    }

    function googleLink() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	// server = 'http://staging.viblio.com';
	return encodeURIComponent( server + '/s/x' );
    }

    function tumblrLink() {
	var server = window.location.protocol + config.site_server;
	// Override for testing
	// server = 'http://staging.viblio.com';

	var thumbnail = encodeURIComponent( server + '/css/images/logo-106.png' );
	var caption   = encodeURIComponent( 'Viblio is a new video platform that stores, sorts and allows you to privately share your personal videos all in a secure cloud location.  Try it out by signing up at www.viblio.com.' );
	var clickthru = encodeURIComponent( server + '/s/x' );

	return 'source=' + thumbnail + '&caption=' + caption + '&click_thru=' + clickthru;
    }
    
    function closeModal() {
        dialog.close(this);
    };
    
    function showBetaReservedModal() {
        dialog.show('viewmodels/betaReserved');
    };

    return {
        shareNetworks: shareNetworks,
                
        closeModal: closeModal,
        showBetaReservedModal: showBetaReservedModal,
        
        attached: function( view, parent ) {
            
            $('.pop').click(function(){
                window.open($(this).attr('href'),'t','toolbar=0,resizable=1,status=0,width=640,height=528');
                return false;
            });
        }
        
    };
});
