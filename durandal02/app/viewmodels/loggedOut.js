define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {

    function showLoggedOutTellFriendsModal() {
        dialog.show('viewmodels/loggedOutTellFriendsModal');
    };

    return {
        
        showLoggedOutTellFriendsModal: showLoggedOutTellFriendsModal
        
    };
});
