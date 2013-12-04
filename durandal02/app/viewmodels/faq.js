define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'lib/customDialogs', 'plugins/http', 'knockout'], function( router, app, system, config, viblio, dialog, http, ko ) {
    
    var signup_email = ko.observable();
    
    function handleLoginFailure( json ) {
	var code = json.code;
	var msg  = json.detail;

	if ( code == "NOLOGIN_NOEMAIL" ) {
	    msg  = "Please enter a valid email address to receive updates.";
	}
	return dialog.showMessage( msg, "Registration Error" );
    };

    // Valid email address is checked, if entered it will send a confirmation email to address
    // and if the confirmation email is clicked then the email address is submitted to mailchimp
    // list called "Viblio Beta Enrollment from Login Page"
    function faqEnroll() {
        if ( $('#mce-EMAIL').val() == "" ) {
	    handleLoginFailure({code: "NOLOGIN_NOEMAIL"});
	    return;
        };
        register( $('#mc-embedded-subscribe-form') );
    };
    
    function register( $form ) {
        $.ajax({
            type: $form.attr('method'),
            url: $form.attr('action').replace('/post?', '/post-json?').concat('&c=?'),
            data: $form.serialize(),
            timeout: 5000, // Set timeout value, 5 seconds
            cache       : false,
            dataType    : 'jsonp',
            contentType: "application/json; charset=utf-8",
            error       : function(err) { alert("Could not connect to the registration server. Please try again later."); },
            success     : function(data) {
                if (data.result != "success") {
                    // Something went wrong, do something to notify the user. maybe alert(data.msg);
                    dialog.showMessage( data.msg, 'Beta Signup' );
                } else {
		    //viblio.mpEvent( 'register_for_beta' );
                    dialog.showMessage( "Thank you for registering for updates. You will receive an email confirmation shortly. Please be sure to confirm your email address by clicking on the link in the email. If you do not complete this step you will not receive any updates", "Registration Sent" );
                }
            }
        });
    };
    
    return {
	signup_email: signup_email,
        
        faqEnroll: faqEnroll,
        register: register
    };
});
