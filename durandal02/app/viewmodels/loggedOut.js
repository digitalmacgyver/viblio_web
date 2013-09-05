define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {

    function showTellAFriendModal() {
        dialog.show('viewmodels/betaReserved');
    };

    return {
        
        showTellAFriendModal: showTellAFriendModal
        
    };
});
