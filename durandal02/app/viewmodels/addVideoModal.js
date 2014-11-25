define( ['plugins/router',
         'lib/config',
         'lib/viblio',
         'lib/customDialogs',
         'plugins/dialog'], 
     
function( router, config, viblio, customDialogs, dialog ) {
    var M = function( mid ) {
        var self = this;
        
        self.mid = mid;
        self.email = ko.observable();
        self.emailValid = ko.computed (function() {
            if ( self.email() && $('.email')[0].checkValidity() ) {
                return true;
            } else {
                return false;
            }
        });
    };
    
    M.prototype.closeModal = function( data ) {
        dialog.close( this, data ? data : null );
    };
    
    M.prototype.addVideo = function() {
        /*services/na/add_video_to_email

        Mandatory arguments: 
        email=user@enteredemail.com
        mid=media-uuid-of-video

        It does a bunch of validation on the email and permissions involved, and if everything is OK:

        If the email corresponds to an existing account:
        1. Adds the video to that user's account, and returns {}

        If the email is not in our system:
        1. Creates a new user account for that email.
        2. Adds the video to that user's account, and returns { user => ...user data structure... }
        3. Sends the user an email (currently the same email as the "try photo finder" think, so that needs to change.*/
        var self = this;
        
        var args = {
            email: self.email(),
            mid: self.mid
        };
        viblio.api( 'services/na/add_video_to_email', args ).then( function( res ) {
            if( res ) {
                self.closeModal( "success" );
            }
        });
    };

    return M;
});
