define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {
    
    var friendsEmails = ko.observableArray();
    var friendsEmailsValid = ko.observable(false);
    var tellFriendsMessage = ko.observable();
    
    friendsEmails.subscribe( function() {
        if ( $('#friendsEmails')[0].checkValidity() ) {
          friendsEmailsValid( true );
        } else {
          friendsEmailsValid( false );
        }
    });
    
    function showLoggedOutTellFriendsModal() {
        dialog.show('viewmodels/loggedOutTellFriendsModal');
    };
    
    function closeModal() {
        dialog.close(this);
    };
    
    function tellFriends() {
        if( ! tellFriendsMessage() ) {
            $('#tellFriendsMessage').val( $('#tellFriendsMessage').attr('placeholder') );
        };
        
        system.log( friendsEmails(), tellFriendsMessage(), $('#tellFriendsMessage').val()  );
    };

    return {
        friendsEmails: friendsEmails,
        friendsEmailsValid: friendsEmailsValid,
        tellFriendsMessage: tellFriendsMessage,
        
        showLoggedOutTellFriendsModal: showLoggedOutTellFriendsModal,
        closeModal: closeModal,
        tellFriends: tellFriends
    };
});
