define(['plugins/router', 'viewmodels/whoWeAre', 'lib/viblio', 'plugins/dialog'], function( router, whoWeAre, viblio, dialog ) {
    
    var clicks = ko.observable( 0 );
    
    var voteEmail = ko.observable('');
    var voteCode = ko.observable('');
    
   
    var backerCode = 'action';
    
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
        if ( voteEmailValid() && voteCode() && chosenVote() && chosenVote() != 'Choose...' ) {
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
        var subject;
        if ( voteCodeValid() ) {
            subject = 'Next activity vote submission - valid code';
        } else {
            subject = 'Next activity vote submission - invalid code';
        }
        
        // Send the vote regardless, but with correct subject. 
        // Only difference to user is which modal they see after vote submission
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
        }).then( function() {
            if ( voteCodeValid() ) {
                viblio.notify( 'Email Sent', 'success' );
                voteEmail('');
                voteCode('');
                chosenVote('Choose...');
                dialog.show('viewmodels/ksVoteThankYouModal');
            } else {
                dialog.show('viewmodels/ksVoteOopsModal');
            }
        });
    }
    
    var showThankYouModal = function() {
        if ( clicks() == 3 ) {
            dialog.show('viewmodels/ksThankYouModal');
        }
    };
    
    return {
        voteEmail: voteEmail,
        voteCode: voteCode,
        options: options,
        chosenVote: chosenVote,
        ownActivity: ownActivity,
        isOwnActivityValid: isOwnActivityValid,
        ownActivityCharsLeft: ownActivityCharsLeft,
        activityFormReady: activityFormReady,
        
        send_vote: send_vote,
        
        compositionComplete: function() {
            
            $('button').on('click', function() {
                clicks( clicks()+1 );
                var percent = Math.min(Math.round(clicks() / 3 * 100), 100);
                $('.percent').width(percent + '%');
                $('.number').text(percent + '%');
            });
            
            var ksurl = 'http://kck.st/1gu4doU';
            
            $('.facebook').on('click', function() {
                var w = 580, h = 300,
                        left = (screen.width/2)-(w/2),
                        top = (screen.height/2)-(h/2);


                    if ((screen.width < 480) || (screen.height < 480)) {
                        window.open ('http://www.facebook.com/share.php?u=' + ksurl, '', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
                    } else {
                        window.open ('http://www.facebook.com/share.php?u=' + ksurl, '', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);   
                    }
                    
                    showThankYouModal();
            });

            $('.twitter').on('click', function() {
                var loc = encodeURIComponent(ksurl),
                        title = "I’m supporting VIBLIO on Kickstarter.  Check it out.",
                        w = 580, h = 300,
                        left = (screen.width/2)-(w/2),
                        top = (screen.height/2)-(h/2);

                    window.open('http://twitter.com/share?text=' + title + '&url=' + loc, '', 'height=' + h + ', width=' + w + ', top='+top +', left='+ left +', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');
                    
                    showThankYouModal();
            });

            $('.linkedin').on('click', function() {
                var loc = encodeURIComponent(ksurl),
                        title = encodeURIComponent("I’m supporting VIBLIO on Kickstarter.  Check it out."),
                        source = encodeURIComponent('Kickstarter'),
                        w = 580, h = 550,
                        left = (screen.width/2)-(w/2),
                        top = (screen.height/2)-(h/2);

                    window.open('http://www.linkedin.com/shareArticle?mini=true&url=' + loc + '&title=' + title + '&source=' + source, 'social', 'height=' + h + ', width=' + w + ', top='+top +', left='+ left +', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');
                    
                    showThankYouModal();
            });
        }
    };
});
