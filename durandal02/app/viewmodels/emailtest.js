define(['lib/viblio'],function(viblio) {
    var email = ko.observable();
    var selectedTemplate = ko.observable();
    var templates = ko.observableArray([
	'03-accountConfirmation.tt',        
        '04b-viblioLikesPrivacyToo.tt',
        '04-07-accountCreated.tt',
        '05-youveGotVideos.tt',
        '06-videosSharedWithYou.tt',
        '08-dontForgetViblio.tt',
        '09-videosWaitingToBeWatched.tt',
        '10-uploadSomeVideos-DRAFT.tt',
        '11-makeSomeMemoriesThisWeekend.tt',
        '12-memoriesFromPastWeek.tt',
        '14-referAFriend.tt',
        '15-inviteToShare.tt',
        '16-commentsOnYourVid.tt',
        '18-forgotPassword.tt',
        '19-albumSharedToYou.tt',
        '20-newVideoAddedToAlbum.tt',
	'firstVideosUploaded.tt',                 
        'weeklyDigest.tt',       
        'newVideos.tt',
	'viblio-app.tt'
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
