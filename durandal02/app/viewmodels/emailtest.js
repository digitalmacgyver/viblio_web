define(['lib/viblio'],function(viblio) {
    var email = ko.observable();
    var selectedTemplate = ko.observable();
    var templates = ko.observableArray([
	'accountCreationConfirmation.tt',
	'firstVideosUploadedEmail.tt',
	'forgotPasswordEmail.tt',
	'newBetaUserWelcomeEmail.tt',
	'newUserConfirmEmail.tt',
	'newVideos.tt',
	'tellAFriend.tt',
	'videosSharedWithYou.tt',
	'weeklyDigest.tt'
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
