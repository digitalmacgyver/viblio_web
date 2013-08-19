define( ['durandal/plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'lib/dialogs', 'facebook'], function( router, app, system, config, viblio, dialogs ) {

    var shareVidEmail = ko.observable();
    var shareEmail_entry_error = ko.observable( false );

    var shareVidMessage = ko.observable();
    var shareMessage_entry_error = ko.observable( false );

    fb_appid   = config.facebook_appid();
    fb_channel = config.facebook_channel();

    FB.init({
	appId: fb_appid,
	channelUrl: fb_channel,
	status: true,
	cookie: true,
	xfbml: true
    });
    
    function showShareVidModal() {
        app.showModal('viewmodels/shareVidModal');
    };
    
    function emailLink() {
        app.showMessage('add email vid func');
    };

    function copyToClipboard() {
        system.log("Here is the shareLink: " + $('#shareLink').val());
    };

    return {
	shareVidEmail: shareVidEmail,
	shareEmail_entry_error: shareEmail_entry_error,

	shareVidMessage: shareVidMessage,
	shareMessage_entry_error: shareMessage_entry_error,
        
        showShareVidModal: showShareVidModal
        
    };
});