define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {

    fb_appid   = config.facebook_appid();
    fb_channel = config.facebook_channel();

    FB.init({
	appId: fb_appid,
	channelUrl: fb_channel,
	status: true,
	cookie: true,
	xfbml: true
    });
    
    function closeModal() {
        dialog.close(this);
    };
    
    function showBetaReservedModal() {
        dialog.show('viewmodels/betaReserved');
    };
    
    function showLabel() {
        
    };

    return {
        
        closeModal: closeModal,
        showBetaReservedModal: showBetaReservedModal
        
    };
});
