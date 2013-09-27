define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {
    
    var friendsEmailsValid = ko.observable(false);
    var tellFriendsMessage = ko.observable();
    
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

	// Give the api call time to process
	viblio.rescheduleLogout( 60 );
	var list = $(self.view).find( "#friendsEmails" ).val();
        system.log( list, message );

	//viblio.api( '/services/user/tell_a_friend', { list: list, message: message } ).then( function() {
	//    self.closeModal();
	//});
    };

    return {
        friendsEmailsValid: friendsEmailsValid,
        tellFriendsMessage: tellFriendsMessage,

	compositionComplete: function( view ) {
	    var self = this;
	    self.view = view;
	    $(self.view).find( "#friendsEmails" ).tokenInput( 
		'/services/faces/contact_emails',
		{ minChars: 2,
		  theme: "facebook",
		  preventDuplicates: true,
		  onAdd: function() {
		      self.friendsEmailsValid( true );
		  },
		  resultsFormatter: function( item ) {
		      return '<li>' + item.name + '&nbsp;(' + item.id + ')</li>';
		  }
		});
	},
        
        showLoggedOutTellFriendsModal: showLoggedOutTellFriendsModal,
        closeModal: closeModal,
        tellFriends: tellFriends
    };
});
