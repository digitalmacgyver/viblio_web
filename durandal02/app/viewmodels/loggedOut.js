define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {

    function showLoggedOutTellFriendsModal() {
	viblio.rescheduleLogout( 5 * 60 ); // give them 5 minutes to complete the tell a friend form
        dialog.show('viewmodels/loggedOutTellFriendsModal');
    };

    return {
        
        showLoggedOutTellFriendsModal: showLoggedOutTellFriendsModal,

	detached: function() {
	    console.log( 'canceling logout timeout' );
	    viblio.cancelScheduledLogoutAndLogout();
	    return true;
	}
        
    };
});
