define(['lib/viblio'],function(viblio) {
    var email = ko.observable();
    var selectedTemplate = ko.observable();
    var templates = ko.observableArray([
	'accountConfirmation.tt',
	'firstVideosUploadedEmail.tt',
	'forgotPasswordEmail.tt',
	'newBetaUserWelcomeEmail.tt',
	'newUserConfirmEmail.tt',
	'newVideos.tt',
	'tellAFriend.tt',
	'videosSharedWithYou.tt',
	'weeklyDigest.tt',
        'referAFriend.tt',
        'newAlphaUserWelcomeEmail.tt',
        'commentsOnYourVid.tt',
        'commentsOnVidSharedWYou.tt',
        'youveGotVideos.tt',
        'accountCreatedShareReferral.tt',
        'videosWaitingToBeWatched.tt',
        'uploadSomeVideos.tt'
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
