define( ['durandal/app', 
	 'lib/viblio',
         'durandal/events',
         'viewmodels/header',
        'viewmodels/conditional_header',
        'viewmodels/hp'], 
function(app, viblio, Events, header, c_header, hp) {
    
    var backgroundImageUrl = ko.observable();
    var defaultImage = "https://s3-us-west-2.amazonaws.com/viblio-external/media/corp-site/viblio-promo-1000-250.gif";
    var albumOrUser = ko.observable("user");
    var currentAlbum = ko.observable( null );
    var avatar = ko.observable( "/services/user/avatar?uid=-&x=120&y=120" );
    var user = viblio.user();
    var hideEdit = ko.observable(null); /* controls visibility on the change avatar button */
    var busyFlag = ko.observable( false );
    var hpFlag = ko.computed( function() {
        if( hp.nhome().isActiveFlag() ) {
            return true;
        } else {
            return false;
        }
    });
    var view;
    
    app.on( 'albumList:gotalbum', function( album ) {
        var photos = [];
        
        albumOrUser( 'album' );
        currentAlbum( album );
        console.log( 'message received', currentAlbum() );
        currentAlbum().media.forEach( function( vid ) {
            vid.views.image.forEach( function( image ) {
                photos.push( image.url );
            });
        });
        backgroundImageUrl( album.views.banner ? album.views.banner.url : null );
        handleBackstretch( photos );
        // the album is shared with the user so show the owner's avatar
        if( album.owner_uuid != user.uuid ) {
            hideEdit( true );
            avatar( "/services/user/avatar?uid=" + album.owner_uuid + "&x=120&y=120" );
        }
        // else it's owned by the viewer, so show the user's avatar
        else {
            hideEdit( false );
            avatar( "/services/user/avatar?uid=-&x=120&y=120"+new Date() );
        }
    });
    
    app.on( 'newHome:filtersAreActive', function( media ) {
        var photos = [];
        albumOrUser( 'user' );
        console.log( 'newHome:filtersAreActive message received', media );
        media.forEach( function( vid ) {
            vid.views.image.forEach( function( image ) {
                photos.push( image.url );
            });
        });
        //backgroundImageUrl( null );
        handleBackstretch( photos );
    });
    
    app.on( 'albumList:notactive', function() {
        albumOrUser( 'user' );
        currentAlbum( null );
        console.log( 'message received', currentAlbum() );
        getBackgroundImage();
    });
    
    app.on( 'newHome:noFiltersAreActive', function( media ) {
        albumOrUser( 'user' );
        currentAlbum( null );
        console.log( 'newHome:noFiltersAreActive message received' );
        getBackgroundImage();
    });
    
    app.on( 'selectedFace:active', function( face ) {
        console.log( 'face filter is on', face );
        hideEdit( true )
        avatar( face.url );
    });
    
    app.on( 'selectedFace:notactive', function() {
        console.log( 'face filter is off, show regular avatar' );
        hideEdit( false );
        avatar( "/services/user/avatar?uid=-&x=120&y=120"+new Date() );
    });
    
    Events.includeIn( this );
    
    function setBackgroundImage() {
        if( albumOrUser() == "user" ) {
            /*services/user/add_or_replace_banner_photo
            With the same parameters as you call add_or_replace_profile_photo
            This method will return the JSON for a mediafile, which is the mediafile of the banner (in particular in the results:
            result->{views}->{banner}->{url} 
            There is the banner URL.*/
            
        } else if( albumOrUser() == "album" ) {
            /*services/album/add_or_replace_banner_photo
            This takes the same parameters as the method above, and one additional one:
            aid = the uuid of the album whose banner is being set.
            Note that this method currently _only_ takes an upload - in the future we'll add features to allow a user to pick an existing image from the UI to be the banner image I suppose.*/
        }
    }
    
    function handleBackstretch( photos ) {
        console.log( "photos", photos, backgroundImageUrl() );
        if( backgroundImageUrl() ) {
            $('.bannerImage').backstretch( backgroundImageUrl() );
        } else {
            if( $('.bannerImage').data('backstretch') ) {
                $('.bannerImage').backstretch("destroy", false);
            }
            
            if( photos && photos.length > 0 ) {
                $('.bannerImage').backstretch( photos );
            }
        }
    }
    
    function getBackgroundImage() {
        if( albumOrUser() == "user" ) {
            var args;
            
            if( user.banner_uuid ) {
                args = {
                    mid: user.banner_uuid
                };
                
                return viblio.api('services/mediafile/get', args).then( function( res ) {
                    console.log( res );
                    backgroundImageUrl( res.media.views.banner.url );
                    handleBackstretch();
                });
            } else {
                // show the default background;
                backgroundImageUrl( null );
                if( $('.bannerImage').data('backstretch') ) {
                    $('.bannerImage').backstretch("destroy", false);
                }
                $('.bannerImage').attr("style", null);
            }
        } else {
            //I've set things so that any time a poster is requested, banners will also be returned.
            
        }
    }
    
    return {
        backgroundImageUrl: backgroundImageUrl,
        avatar: avatar,
        albumOrUser: albumOrUser,
        hideEdit: hideEdit,
        busyFlag: busyFlag,
        hpFlag: hpFlag,
        
        activate: function() {
            getBackgroundImage();
        },
        
        detached: function() {
            $('.avatarUpload').fileupload('destroy');
            $('.albumCoverUpload').fileupload('destroy');
            $('.userCoverUpload').fileupload('destroy');
        },
        
        compositionComplete: function( _view ) {
	    view = _view;
            
            // jqueryFileUpload
            // avatar
	    $(view).find(".changeBannerAvatar-Outerwrap").on( 'click', function() {
		$(view).find(".avatarUpload").click();
	    });
	    $(view).find(".avatarUpload").fileupload({
                options: {
                    acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i
                },
		dataType: 'json',
		done: function(e, data) {
                    // update avatar in settings and the headers
                    avatar( null );
                    avatar( "/services/user/avatar?uid=-&x=120&y=120"+new Date() );
                    header.updateAvatar();
                    c_header.updateAvatar();
		}
	    })
               // prevent the input from grabbing file uploads on drag and drop 
              .bind('fileuploaddrop', function (e, data) { e.preventDefault(); })
              .bind('fileuploaddragover', function (e) { e.preventDefault(); });
            
            
            // cover photos - decide which input to use based on if the user is looking at an album or not
            $(".editIcon-Wrap").on( 'click', function() {
                if( albumOrUser() == "album" ) {
                    $(".albumCoverUpload").click();
                } else {
                    $(".userCoverUpload").click();
                }
	    });
            
            // user cover photo
            $('.userCoverUpload').fileupload({
                options: {
                    acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i
                },
                start: function() {
                    busyFlag( true );
                },
                change: function (e, data) {
                    console.log( data );
                    $.each(data.files, function (index, file) {
                        console.log('Selected file: ' + file.name);
                    });
                },
                add: function (e, data) {
                    console.log( data );
                    data.submit();
                },
                done: function (e, data) {
                    console.log( data );
                    backgroundImageUrl( data.result[0].views.banner.url );
                    handleBackstretch();
                    busyFlag( false );
                }
            })
              // prevent the input from grabbing file uploads on drag and drop       
              .bind('fileuploaddrop', function (e, data) { e.preventDefault(); })
              .bind('fileuploaddragover', function (e) { e.preventDefault(); });
            
            // album cover photo
            $('.albumCoverUpload').fileupload({
                options: {
                    acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i
                },
                start: function() {
                    busyFlag( true );
                },
                change: function (e, data) {
                    console.log( data );
                    $.each(data.files, function (index, file) {
                        console.log('Selected file: ' + file.name);
                    });
                },
                add: function (e, data) {
                    console.log( data );
                    var aid = currentAlbum().uuid;
                    data.formData = {
                        aid: aid,
                        upload: data.files[0]
                    }
                    data.submit();
                },
                done: function (e, data) {
                    console.log( data );
                    backgroundImageUrl( data.result[0].views.banner.url );
                    handleBackstretch();
                    busyFlag( false );
                }
            })
               // prevent the input from grabbing file uploads on drag and drop      
              .bind('fileuploaddrop', function (e, data) { e.preventDefault(); })
              .bind('fileuploaddragover', function (e) { e.preventDefault(); });
            
            handleBackstretch();
            
            app.trigger( 'coverphoto:composed', this );
	}
    
    };
});