define(['plugins/router', 'viewmodels/whoWeAre', 'lib/viblio'], function( router, whoWeAre, viblio ) {
    
    var voteEmail = ko.observable('');
    var voteCode = ko.observable('');
    
    // Backer code needed
    var backerCode = '';
    
    var voteCodeValid = ko.computed (function() {
        if ( voteCode() && voteCode() === backerCode ) {
            return true;
        } else {
            return false;
        }
    });
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
        if ( voteEmailValid() && voteCodeValid() && chosenVote() && chosenVote() != 'Choose...' ) {
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
            voteCode('');
            chosenVote('Choose...');
        });
    }
    
    return {
        voteEmail: voteEmail,
        voteCode: voteCode,
        options: options,
        chosenVote: chosenVote,
        ownActivity: ownActivity,
        isOwnActivityValid: isOwnActivityValid,
        ownActivityCharsLeft: ownActivityCharsLeft,
        activityFormReady: activityFormReady,
        
        send_vote: send_vote        
    };
});
