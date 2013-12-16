define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {

    function showLoggedOutTellFriendsModal() {
	viblio.rescheduleLogout( 5 * 60 ); // give them 5 minutes to complete the tell a friend form
        var args = {};
        args.placeholder = "Check out Viblio! If you join the Beta, we can share videos privately and easily!";
        args.logout = true;
        dialog.show('viewmodels/loggedOutTellFriendsModal', args);
    };

    return {
        
        showLoggedOutTellFriendsModal: showLoggedOutTellFriendsModal,

	detached: function() {
	    viblio.cancelScheduledLogoutAndLogout();
	    return true;
	}
        
    };
});
