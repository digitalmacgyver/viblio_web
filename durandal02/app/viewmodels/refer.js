define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog'], function( router, app, system, config, viblio, dialog ) {
    
    var friendsEmailsValid = ko.observable(false);
    var referFriendsMessage = ko.observable();
    var placeholderText = ko.observable('Check out Viblio! If you join the Beta, we can share videos privately and easily!');
    var emailTemplate = ko.observable();

    function tellFriends() {
	var self = this;
        if( ! referFriendsMessage() ) {
            $('#referFriendsMessage').val( $('#referFriendsMessage').attr('placeholder') );
        };
        
	var message = referFriendsMessage();
	if ( ! message ) 
	    message = $('#referFriendsMessage').val();

	var list = $(self.view).find( "#friendsEmails" ).tokenInput("get");
	var emails = [];
	list.forEach( function( email ) {
	    emails.push( email.id || email.name );
	});

	viblio.api( '/services/user/tell_a_friend', { list: emails, message: message, emailTemplate: emailTemplate() === 15 ? 15 : 14 } ).then( function() {
	    viblio.notify( 'Email sent', 'success' );
	    viblio.mpEvent( 'tell_a_friend' );
            
            $(self.view).find( "#friendsEmails" ).tokenInput("clear");
            friendsEmailsValid( false );
	});
    };
    
    function getWidths() {
        console.log( 'getWidths fired', $('.uitoken-input').css( 'width', token + "px" ) );
        var totalWidth = $('.referFriendsPage').width()-100;
        var refer = totalWidth - 74;
        var token = totalWidth - 46;
        
        $('#referFriendsMessage').css( 'width', refer + "px" );
        $('.uitoken-input').css( 'width', token + "px" );
        $('.token-input-list-facebook').css( 'width', token + "px" );
    }

    return {
        friendsEmailsValid: friendsEmailsValid,
        referFriendsMessage: referFriendsMessage,
        placeholderText: placeholderText,
        
        tellFriends: tellFriends,
        
        // when called from other viewmodel, the placeholder text is set and sent along
        activate: function() {
            // reset value in case user shared already during their session
            friendsEmailsValid(false);
            // reset email template
            emailTemplate('');
        },
        
        attached: function() {
            $(window).on( "resize", getWidths );
        },
        
        detached: function() {
            $(window).off( "resize", getWidths );
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
            getWidths();
	}
    };
});
