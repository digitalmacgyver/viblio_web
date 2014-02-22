define( ['plugins/router',
         'lib/viblio',
         'viewmodels/mediafile',
         'durandal/app',
         'durandal/events',
         'durandal/system',
         'lib/customDialogs',
         'plugins/dialog'], 
     
function( router,viblio, Mediafile, app, events, system, customDialogs, dialog ) {
    
    var profileData = ko.observable();
    
    closeModal = function() {
        dialog.close(this);
    };
    
    return {
        profileData: profileData,
        
        activate: function( data ) {
            profileData(data);
        }
    };	
});