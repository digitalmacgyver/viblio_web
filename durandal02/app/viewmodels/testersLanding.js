define(['plugins/router', 'viewmodels/whoWeAre', 'lib/viblio', 'plugins/dialog'], function( router, whoWeAre, viblio, dialog ) {
    
    var email = ko.observable();
    var emailValid = ko.computed( function() {
        if( email() && $('#email')[0].checkValidity() ){
            return true;
        } else {
            return false;
        }
    });
    var email2 = ko.observable();
    var email2Valid = ko.computed( function() {
        if( email2() && $('#email2')[0].checkValidity() ){
            return true;
        } else {
            return false;
        }
    });
    
    function register() {
        sendEmail( email() );
    };
    
    function register2() {
        sendEmail( email2() );
    };
    
    function sendEmail( email ) {
        $.ajax({
            url: '/services/na/emailer',
            method: 'POST',
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify({
                subject: "New beta user registration",
                to: [{ email: 'notifications@viblio.com', name: 'Notifications' }],
                body: '<p>We have a new beta tester user.  The email is: ' + email + '</p>'
            })
        }).then( function() {
            router.navigate( '#signup?email='+email );
        });
    };
    
    return {
        email: email,
        emailValid: emailValid,
        email2: email2,
        email2Valid: email2Valid,
        
        register: register,
        register2: register2,
        
        activate: function(  ) {
            
        }
        
    };
});
