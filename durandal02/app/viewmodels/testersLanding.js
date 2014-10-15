define(['plugins/router', 'viewmodels/whoWeAre', 'lib/viblio', 'plugins/dialog'], function( router, whoWeAre, viblio, dialog ) {
    
    var email = ko.observable();
    var emailValid = ko.computed( function() {
        if( email() && $('#email')[0].checkValidity() ){
            return true;
        } else {
            return false;
        }
    });
    var email2 = ko.observable();
    var email2Valid = ko.computed( function() {
        if( email2() && $('#email2')[0].checkValidity() ){
            return true;
        } else {
            return false;
        }
    });
    
    var screenWidth = ko.observable( $(window).width() );
    
    function register() {
        sendEmail( email() );
    };
    
    function register2() {
        sendEmail( email2() );
    };
    
    function sendEmail( email ) {
        $.ajax({
            url: '/services/na/emailer',
            method: 'POST',
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify({
                subject: "New beta user registration",
                to: [{ email: 'notifications@viblio.com', name: 'Notifications' }],
                body: '<p>We have a new beta tester user.  The email is: ' + email + '</p>'
            })
        }).then( function() {
            router.navigate( '#signup?email='+email );
        });
    };
    
    function resizePlayer() {
        screenWidth( $(window).width() );
        console.log( screenWidth() );
	var player_height = $(".promo-player").width()*.362;
        $(".promo-player").children().height(player_height).width('100%');
	$(".promo-player, .promo-player video").height( player_height );
    }
    
    return {
        email: email,
        emailValid: emailValid,
        email2: email2,
        email2Valid: email2Valid,
        
        register: register,
        register2: register2,
        
        screenWidth: screenWidth,
        
        detached: function () {
	    $(window).unbind( 'resize', resizePlayer );
	    if(flowplayer()){
                flowplayer().unload();
            }
	},
        
        compositionComplete: function() {
            screenWidth( $(window).width() );
            $(".promo-player").flowplayer({ src: "lib/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' }, {
                clip: {
                    url: 'https://s3-us-west-2.amazonaws.com/viblio-external/media/corp-site/viblio-promo.mp4'
                }
            });
            resizePlayer();
            $(window).bind('resize', resizePlayer );
        }
        
    };
});
