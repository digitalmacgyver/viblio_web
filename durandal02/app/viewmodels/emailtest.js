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
        'referAFriend.tt',
        'uploadSomeVideos-DRAFT.tt',
        'videosSharedWithYou.tt',
        'videosWaitingToBeWatched.tt',
        'weeklyDigest.tt',
        'youveGotVideos.tt',
        'viblioLikesPrivacyToo.tt',
        'dontForgetViblio.tt',
        'newVideos.tt',
        'memoriesFromPastWeek.tt',
        'inviteToShare.tt',
        'albumSharedToYou.tt'
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
