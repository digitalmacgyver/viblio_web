define(['lib/viblio'],function(viblio) {
    var email = ko.observable();
    var selectedTemplate = ko.observable();
    var templates = ko.observableArray([
	'accountConfirmation.tt',
        'accountCreated_ShareReferral.tt',
        'accountCreated_trayApp.tt',
        'commentsOnVidSharedWYou.tt',
        'commentsOnYourVid.tt',
	'firstVideosUploaded.tt',
	'forgotPassword.tt',
        'newVideos.tt',
        'referAFriend.tt',
        'uploadSomeVideos.tt',
        'videosSharedWithYou.tt',
        'videosWaitingToBeWatched.tt',
        'weeklyDigest.tt',
        'youveGotVideos.tt' 
    ]);
    var forceStaging = ko.observable( true );

    return {
	email: email,
	selectedTemplate: selectedTemplate,
	templates: templates,
	forceStaging: forceStaging,
	test: function() {
	    viblio.api( '/services/test/template_test',
			{ email: email(),
			  force_staging: forceStaging(),
			  template: selectedTemplate() } )
		.then( function() {
		    viblio.notify( 'Email Sent', 'success' );
		});
	}
    };
});
