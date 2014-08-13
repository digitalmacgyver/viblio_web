define(['plugins/router', 'viewmodels/whoWeAre', 'lib/viblio', 'plugins/dialog'], function( router, whoWeAre, viblio, dialog ) {
    
    var email = ko.observable();
    
    function sendEmail() {
        $.ajax({
            url: '/services/na/emailer',
            method: 'POST',
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify({
                subject: "Edited Video Summary Request",
                to: [{ email: 'notifications@viblio.com', name: 'Notifications' }],
                body: '<p>Email: ' + email() + ' has requested an edited video summary on ' + new Date() + '</p>'
            })
        }).then( function() {
            //console.log( 'success' );
        });
    };
    
    function goToLogin() {
        router.navigate( '#home' );
    }
    
    return {
        email: email,
        goToLogin: goToLogin,
        
        activate: function( args ) {
            // extract email address from url
            email( args.email );
            // clean the email address from the url
            router.navigate('#proVidsLanding', { trigger: false, replace: true });       
            // then send an email to notifiactions@viblio.com
            sendEmail();
        }
        
    };
});
