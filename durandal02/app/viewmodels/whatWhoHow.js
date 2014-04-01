define(['plugins/router', 'viewmodels/whoWeAre', 'lib/viblio'], function( router, whoWeAre, viblio ) {
    
    var showWhat = ko.observable(true);
    var showWho = ko.observable(false);
    var showHow = ko.observable(false);
    
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
        if ( chosenVote() && chosenVote() != 'Choose...' ) {
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
    
    //-------------- How Section ----------------//
    var selected = ko.observable('support');
    var name = ko.observable('');
    var email = ko.observable('');
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
       if ( name() != '' && email() != '' && comment() != '' ) {
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
            subject = 'Contact Support email';
        } else if ( selected() == 'feedback' ) {
            subject = 'Feedback email';
        } else {
            subject = 'Media Inquiries email';
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
                body: '<p>Chosen vote: ' + voteToSubmit() + '</p>'
            })
        }).always( function() {
            // dont stress over the result
            viblio.notify( 'Email Sent', 'success' );
        }).then( function() {
            chosenVote('Choose...');
        });
    }
    
    return {
        whoWeAre: whoWeAre,
        
        showWhat: showWhat,
        showWho: showWho,
        showHow: showHow,
        
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
        
        activate: function(args) {
            if (args ) {
                if ( args.showWhat ) {
                    showWhat( true );
                    showWho( false );
                    showHow( false );
                } else if ( args.showWho ) {
                    showWhat( false );
                    showWho( true );
                    showHow( false );
                } else {
                    showWhat( false );
                    showWho( false );
                    showHow( true );
                }
            }
        }
    };
});
