define(['plugins/router',
        'viewmodels/whoWeAre',
        'lib/viblio',
        'lib/config',
        'viewmodels/faq'], 
    function( router, whoWeAre, viblio, config, faq ) {
    
    var showWhat = ko.observable(true);
    var showWho = ko.observable(false);
    var showHow = ko.observable(false);
    var showPrivacy = ko.observable(false);
    var showFAQ = ko.observable(false);
    
    var voteEmail = ko.observable('');
    var voteEmailValid = ko.computed (function() {
        if ( voteEmail() && $('#vote_email')[0].checkValidity() ) {
            return true;
        } else {
            return false;
        }
    });
    var socialActivities = ko.observableArray([
        'Parties (birthdays, weddings, dinner parties,…)', 'Performances', 'Pets (cats, dogs)', 'Children (any activity with lots of kids)',
        'Animals (elephants, giraffes, lions,…)', 'Water wildlife (fish, seals, dophins,…)', 'Presentations'
    ]);
    var sports = ko.observableArray([
        'Water sports (swimming, surfing,…)', 'Snow sports (skiing, snowboarding,…)', 'Bicyclng', 'Running'
    ]);
    var places = ko.observableArray([
        'City', 'Beach', 'Woods', 'Inside'
    ]);
    var options = ko.observableArray([
        { name: 'Social Activities', list: socialActivities() },
        { name: 'Sports', list: sports() },
        { name: 'Places', list: places() }
    ]);
    var chosenVote = ko.observable(null);
    var ownActivity = ko.observable(null);
    var isOwnActivityValid = ko.computed( function() {
        if ( ownActivity() && ownActivity().length <= 20 ) {
            return true;
        } else {
            return false;
        }
    });
    var ownActivityCharsLeft = ko.computed( function() {
        if ( chosenVote() == 'other' && ownActivity() ) {
            return 20 - ownActivity().length;
        } else {
            return 20;
        }
    });
    var voteToSubmit = ko.computed( function() {
        if ( chosenVote() && chosenVote() == 'other' ) {
            return 'Other: ' + ownActivity();
        } else {
            return chosenVote();
        }
    });
    var activityFormReady = ko.computed(function() {
        if ( voteEmailValid() && chosenVote() && chosenVote() != 'Choose...' ) {
            if ( chosenVote() != 'other' ) {
                return true;
            } else if ( ownActivity() && isOwnActivityValid() ) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    });
    
    function resizePlayer() {
	var player_height = $(".promo-player").width()*.362;
        $(".promo-player").children().height(player_height).width('100%');
	$(".promo-player, .promo-player video").height( player_height );
    }
    
    function should_simulate() {
	var videoel = document.createElement("video"),
	idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
	noflash = flashembed.getVersion()[0] === 0,
	simulate = !idevice && noflash &&
            !!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
	return simulate;
    }
    
    //-------------- How Section ----------------//
    var selected = ko.observable('support');
    var name = ko.observable('');
    var email = ko.observable('');
    var emailValid = ko.computed (function() {
        if ( email() && $('#how_email')[0].checkValidity() ) {
            return true;
        } else {
            return false;
        }
    });
    var website = ko.observable('');
    var comment = ko.observable('');
    
    function selectSupport() {
        selected('support');
    };
    
    function selectFeedback() {
        selected('feedback');
    };
    
    function selectMedia() {
        selected('media');
    };
    
    var formReady = ko.computed( function() {
       if ( name() != '' && emailValid() && comment() != '' ) {
           return true;
       } else {
           return false;
       }
    });
    
    function resetForm() {
        name('');
        email('');
        website('');
        comment('');
    }
    
    function send_comment() {
        var subject;
        if ( selected() == 'support' ) {
            subject = 'CONTACT SUPPORT from Get in Touch Web Page';
        } else if ( selected() == 'feedback' ) {
            subject = 'FEEDBACK from Get in Touch Web Page';
        } else {
            subject = 'MEDIA INQUIRIES from Get in Touch Web Page';
        }
        
        $.ajax({
            url: '/services/na/emailer',
            method: 'POST',
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify({
                subject: subject,
                to: [{ email: 'notifications@viblio.com', name: 'Notifications' }],
                body: '<p>From: ' + name() +'</p>\n\
                       <p>Email: ' + email() + '</p>\n\
                       <p>Website: ' + website() + '</p>\n\
                       <p>Comment: ' + comment() + '</p>'
            })
        }).always( function() {
            // dont stress over the result
            viblio.notify( 'Email Sent', 'success' );
        }).then( function() {
            resetForm();
        });
    };
    //-------------- End How Section ----------------//
    
    function send_vote() {
        var subject = 'Next activity vote submission'
        $.ajax({
            url: '/services/na/emailer',
            method: 'POST',
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify({
                subject: subject,
                to: [{ email: 'notifications@viblio.com', name: 'Notifications' }],
                body: '<p>Email: ' + voteEmail() + '</p>\n\
                       <p>Chosen vote: ' + voteToSubmit() + '</p>'
            })
        }).always( function() {
            // dont stress over the result
            viblio.notify( 'Email Sent', 'success' );
        }).then( function() {
            voteEmail('');
            chosenVote('Choose...');
        });
    }
    
    return {
        whoWeAre: whoWeAre,
        faq: faq,
        
        showWhat: showWhat,
        showWho: showWho,
        showHow: showHow,
        showPrivacy: showPrivacy,
        showFAQ: showFAQ,
        
        voteEmail: voteEmail,
        options: options,
        chosenVote: chosenVote,
        ownActivity: ownActivity,
        isOwnActivityValid: isOwnActivityValid,
        ownActivityCharsLeft: ownActivityCharsLeft,
        activityFormReady: activityFormReady,
        
        //-------------- How Section ----------------//
        selected: selected,
        name: name,
        email: email,
        website: website,
        comment: comment,
        
        selectSupport: selectSupport,
        selectFeedback: selectFeedback,
        selectMedia: selectMedia,
        formReady: formReady,
        send_comment: send_comment,        
        //-------------- End How Section ----------------//
        
        send_vote: send_vote,
        
        detached: function () {
	    $(window).unbind( 'resize', resizePlayer );
	    if(flowplayer()){
                flowplayer().unload();
            }
	},
        
        activate: function(args) {
            if ( args ) {
                if ( args.showWhat ) {
                    showWhat( true );
                    showWho( false );
                    showHow( false );
                    showPrivacy( false );
                    showFAQ( false );
                } else if ( args.showWho ) {
                    showWhat( false );
                    showWho( true );
                    showHow( false );
                    showPrivacy( false );
                    showFAQ( false );
                } else if ( args.showPrivacy ) {
                    showWhat( false );
                    showWho( false );
                    showHow( false );
                    showPrivacy( true );
                    showFAQ( false );
                } else if ( args.showFAQ ) {
                    showWhat( false );
                    showWho( false );
                    showHow( false );
                    showPrivacy( false );
                    showFAQ( true );
                } else {
                    showWhat( false );
                    showWho( false );
                    showHow( true );
                    showPrivacy( false );
                    showFAQ( false );
                }
                
                if( args.selected && args.selected == 'feedback' ) {
                    selectFeedback();
                }
            }
        },
        
        compositionComplete: function() {
            $(".promo-player").flowplayer({ src: "lib/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' }, {
                clip: {
                    url: 'https://s3-us-west-2.amazonaws.com/viblio-external/media/corp-site/viblio-promo.mp4'
                }
            }).flowplayer().ipad({simulateiDevice: should_simulate()});
            resizePlayer();
            $(window).bind('resize', resizePlayer );
        }
    };
});
