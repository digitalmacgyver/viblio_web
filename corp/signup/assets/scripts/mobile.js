var Mobile = function () {
    
    $("#androidForm").validate({
        rules: {
            email: "required"
        },
        submitHandler: function(form) {
            handleForm();
        }
     });
    
    /*$( "#androidForm" ).submit(function( event ) {
        console.log('submit form fired', $('#email').val());
        handleForm();
        event.preventDefault();
    });*/
    
    var handleForm = function() {
        console.log('submitting form');
        var subject = 'Request for Android App'
        
        $.ajax({
            url: '/services/na/emailer',
            method: 'POST',
            contentType: 'application/json;charset=utf-8',
            data: JSON.stringify({
                subject: subject,
                to: [{ email: 'jesse@viblio.com', name: 'Feature Request' }],
                body: '<p>This form was submitted via the phone landing page form.</p>\n\
                       <p>Email: ' + $('#email').val() + '</p>'
            })
        }).then( function() {
            $('#email').val('');
            alert('Thanks for your input!');
        });
    };
    
    
}();