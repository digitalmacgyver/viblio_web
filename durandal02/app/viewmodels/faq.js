define( ['plugins/router',
         'durandal/app',
         'durandal/system',
         'lib/config',
         'lib/viblio',
         'lib/customDialogs',
         'plugins/http',
         'knockout'],
    function( router, app, system, config, viblio, dialog, http, ko ) {
    
    var signup_email = ko.observable();
    var viewResolved = $.Deferred();
    
    function handleLoginFailure( json ) {
	var code = json.code;
	var msg  = json.detail;

	if ( code == "NOLOGIN_NOEMAIL" ) {
	    msg  = "Please enter a valid email address to receive updates.";
	}
	return dialog.showMessage( msg, "Registration Error" );
    };

    // Valid email address is checked, if entered it will send a confirmation email to address
    // and if the confirmation email is clicked then the email address is submitted to mailchimp
    // list called "Viblio Beta Enrollment from Login Page"
    function faqEnroll() {
        if ( $('#mce-EMAIL').val() == "" ) {
	    handleLoginFailure({code: "NOLOGIN_NOEMAIL"});
	    return;
        };
        register( $('#mc-embedded-subscribe-form') );
    };
    
    function register( $form ) {
        $.ajax({
            type: $form.attr('method'),
            url: $form.attr('action').replace('/post?', '/post-json?').concat('&c=?'),
            data: $form.serialize(),
            timeout: 5000, // Set timeout value, 5 seconds
            cache       : false,
            dataType    : 'jsonp',
            contentType: "application/json; charset=utf-8",
            error       : function(err) { alert("Could not connect to the registration server. Please try again later."); },
            success     : function(data) {
                if (data.result != "success") {
                    // Something went wrong, do something to notify the user. maybe alert(data.msg);
                    dialog.showMessage( data.msg, 'Beta Signup' );
                } else {
		    //viblio.mpEvent( 'register_for_beta' );
                    dialog.showMessage( "Thank you for registering for updates. You will receive an email confirmation shortly. Please be sure to confirm your email address by clicking on the link in the email. If you do not complete this step you will not receive any updates", "Registration Sent" );
                }
            }
        });
    };
    
    // This will scroll to the part of the page that contains the bookmark (an id named the same as the args passed in in activate) when the page is loaded
    function activateBookmark(bookmark) {
        $.when(viewResolved).then(function (view) {
            var $bookmark = $(bookmark);
            // scroll to the top of the chosen seciton minus 65 (the height of the header);
            $(document.body).animate({ scrollTop: $bookmark.offset().top-65 });
        });
    };
    
    // handles the scroll to when links are actually clicked on
    function scrollTo( url ) {
        var hash = url.slice( url.lastIndexOf('#'), url.length );
        var $bookmark = $(hash);
        
        // if you're already at that URL just scroll to that position
        if( router.activeInstruction().params[0] == hash ) {
            $(document.body).animate({ scrollTop: $bookmark.offset().top-65 });
        }
        // else add the url to the history and then scroll to that section (this is useful for a refresh since it will load on refresh, but won't cause a page reload)
        else {
            router.navigate( url, { replace: true, trigger: false } );
            $(document.body).animate({ scrollTop: $bookmark.offset().top-65 });
        }
    }
    
    function resizePlayer() {
	var player_height = $(".faqVid-Wrap").width()*.75;
        $(".faqVid-Wrap").children().height(player_height).width('100%');
	$(".faqVid-Wrap, .faqVid-Wrap video").height( player_height );
    }
    
    function should_simulate() {
	var videoel = document.createElement("video"),
	idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
	noflash = flashembed.getVersion()[0] === 0,
	simulate = !idevice && noflash &&
            !!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
	return simulate;
    }
    
    return {
	signup_email: signup_email,
        
        faqEnroll: faqEnroll,
        register: register,
        scrollTo: scrollTo,
        
        activate: function( args ) {
            var bookmark = args;
            if (bookmark) {
                activateBookmark(bookmark);
            }
        },
        
        compositionComplete: function(view) {
            viewResolved.resolve(view);
            
            $(".faqVid-Wrap").flowplayer({ src: "lib/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' }, {
                clip: {
                    url: 'https://s3-us-west-2.amazonaws.com/viblio-external/media/corp-site/photos_from_videos.mp4​'
                },
                onStart: function( clip ) {
                    flowplayer().mute();    
                },
                // make the video loop 
                onBeforeFinish: function() { 
                    return false; 
                }
            }).flowplayer().ipad({simulateiDevice: should_simulate()});
            resizePlayer();
            $(window).bind('resize', resizePlayer );
        },
        
        detached: function () {
	    $(window).unbind( 'resize', resizePlayer );
	    if(flowplayer()){
                flowplayer().unload();
            }
	},
    };
});
