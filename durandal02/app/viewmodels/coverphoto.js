define( ['plugins/router', 
	 'durandal/app', 
	 'lib/viblio', 
	 'lib/config', 
	 'lib/customDialogs',
         'durandal/events',
         'plugins/dialog'], 
function(router, app, viblio, config, dialogs, Events, dialog) {
    
    var backgroundImageUrl = ko.observable(null);
    var albumOrUser = ko.observable();
    var user = viblio.user();
    var view;
    
    Events.includeIn( this );
    
    function setBackgroundImage() {
        if( albumOrUser() == "user" ) {
            /*services/user/add_or_replace_banner_photo
            With the same parameters as you call add_or_replace_profile_photo
            This method will return the JSON for a mediafile, which is the mediafile of the banner (in particular in the results:
            result->{views}->{banner}->{url} 
            There is the banner URL.*/
            
        } else {
            /*services/album/add_or_replace_banner_photo
            This takes the same parameters as the method above, and one additional one:
            aid = the uuid of the album whose banner is being set.
            Note that this method currently _only_ takes an upload - in the future we'll add features to allow a user to pick an existing image from the UI to be the banner image I suppose.*/
        }
    }
    
    function getBackgroundImage() {
        if( albumOrUser() == "user" ) {
            /*The user object now has a new field: banner_uuid, this is the UUID of a mediafile.
            You can get information about this mediafile in any way you usually get mediafile information, probably most simply by:
            services/mediafile/get 
            mid = banner_uuid
            The result->media->views->banner->url is where we can get the image from.*/
        } else {
            //I've set things so that any time a poster is requested, banners will also be returned.
        }
    }
    
    return {
        backgroundImageUrl: backgroundImageUrl,
        
        compositionComplete: function( _view ) {
	    view = _view;
	    app.trigger( 'coverPhoto:composed', this );
	}
    
    };
});