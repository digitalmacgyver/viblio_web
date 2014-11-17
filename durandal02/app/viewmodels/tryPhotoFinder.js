define( ['plugins/router', 
	 'durandal/app', 
	 'durandal/system', 
	 'lib/config', 
	 'lib/viblio', 
	 'lib/customDialogs'], 
function( router, app, system, config, viblio ) {

    var email = ko.observable();
    
    var busyFlag = ko.observable( null );
    var user;
    
    function createAccount() {
        /*New user account creation without a password:

        services/na/new_user_no_password

            Arguments:

        email=email@ofuser.com

        The return value is: { "user" : user }, and the user is authenticated just as if they had called services/na/new_user*/
        
        var args = {
            email: email()
        };
        
        viblio.api( 'services/na/new_user_no_password', args ).then( function( data ) {
            console.log( data );
            
        });
    }
    
    function sendPhotos() {
        
    }

    return {
	email: email,
        busyFlag: busyFlag,
        
        sendPhotos: sendPhotos,
        
	activate: function( args ) {
	    
	},
        
        compositionComplete: function( view ) {
            // set up uploader
            $(view).find( '.vup' ).viblio_landinguploader({
		uuid: viblio.getUser().uuid,
		endpoint: '/files',
		done_message: 'Done; Processing...',
		alert_class: 'alert-error',
		notify_class: 'alert-success',
                skip_faces: false
	    });
        }

    };
});
