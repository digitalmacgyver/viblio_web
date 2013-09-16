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
	viblio.cancelScheduledLogoutAndLogout();
    };
    
    function tellFriends() {
	var self = this;
        if( ! tellFriendsMessage() ) {
            $('#tellFriendsMessage').val( $('#tellFriendsMessage').attr('placeholder') );
        };
        
	var message = tellFriendsMessage();
	if ( ! message ) 
	    message = $('#tellFriendsMessage').val();

        system.log( friendsEmails(), message );

	// Give the api call time to process
	viblio.rescheduleLogout( 60 );
	viblio.api( '/services/user/tell_a_friend', { list: friendsEmails(), message: message } ).then( function() {
	    self.closeModal();
	});
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
