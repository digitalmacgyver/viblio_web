define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog'], function( router, app, system, config, viblio, dialog ) {
    
    var friendsEmailsValid = ko.observable(false);
    var tellFriendsMessage = ko.observable();
    var placeholderText = ko.observable();
    var shouldBeLoggedOut = ko.observable();
    var emailTemplate = ko.observable();
    
    function showLoggedOutTellFriendsModal() {
        dialog.showAnimated('viewmodels/loggedOutTellFriendsModal');
    };
    
    function closeModal() {
        dialog.close(this);
        if( shouldBeLoggedOut() ) {
            viblio.cancelScheduledLogoutAndLogout();
        }
    };

    function cimport() {
	var viblio = require( 'lib/viblio' );
	viblio.mpEvent( 'address_book_import' );
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
        if( shouldBeLoggedOut() ) {
            viblio.rescheduleLogout( 60 );
        }

	var list = $(self.view).find( "#friendsEmails" ).tokenInput("get");
	var emails = [];
	list.forEach( function( email ) {
	    emails.push( email.id || email.name );
	});

	viblio.api( '/services/user/tell_a_friend', { list: emails, message: message, emailTemplate: emailTemplate() === 15 ? 15 : 14 } ).then( function() {
	    viblio.notify( 'Email sent', 'success' );
	    viblio.mpEvent( 'tell_a_friend' );
	    self.closeModal();
	});
    };

    return {
        friendsEmailsValid: friendsEmailsValid,
        tellFriendsMessage: tellFriendsMessage,
        placeholderText: placeholderText,
	cimport: cimport,
        
        // when called from other viewmodel, the placeholder text is set and sent along
        activate: function( args ) {
            // reset value in case user shared already during their session
            friendsEmailsValid(false);
            // reset email template
            emailTemplate('');
            placeholderText(args.placeholder);
            shouldBeLoggedOut(args.logout);
            emailTemplate(args.template);
        },
	compositionComplete: function( view ) {
	    var self = this;
	    self.view = view;
            
            // Sets up placeholder compatability for IE when needed
            $('input, textarea').placeholder();

	    $(self.view).find( "#friendsEmails" ).tokenInput( 
		'/services/faces/contact_emails',
		{ minChars: 2,
		  theme: "facebook",
		  preventDuplicates: true,
		  onAdd: function() {
		      self.friendsEmailsValid( true );
		  },
		  resultsFormatter: function( item ) {
		      return '<li>' + item.name + '&nbsp;(' + (item.id || item.name) + ')</li>';
		  }
		});
                
            $("#token-input-friendsEmails").attr("placeholder", "Email");    
	},
        
        showLoggedOutTellFriendsModal: showLoggedOutTellFriendsModal,
        closeModal: closeModal,
        tellFriends: tellFriends
    };
});
