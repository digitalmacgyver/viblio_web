define( ['plugins/router', 
	 'durandal/app', 
	 'lib/viblio', 
	 'lib/config', 
	 'lib/customDialogs',
         'durandal/events',
         'plugins/dialog'], 
function(router, app, viblio, config, dialogs, Events, dialog) {
    
    var backgroundImageUrl = ko.observable('../css/images/wide-wallpaper.jpg');
    var albumOrUser = ko.observable("user");
    var currentAlbum = ko.observable( null )
    var user = viblio.user();
    var view;
    
    app.on( 'albumList:gotalbum', function( album ) {
        albumOrUser( 'album' );
        currentAlbum( album );
        console.log( 'message received', currentAlbum() );
        backgroundImageUrl( album.views.banner ? album.views.banner[0].url : null );
    });
    
    app.on( 'albumList:notactive', function() {
        albumOrUser( 'user' );
        currentAlbum( null );
        console.log( 'message received', currentAlbum() );
        getBackgroundImage();
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
                });
            }
        } else {
            //I've set things so that any time a poster is requested, banners will also be returned.
            
        }
    }
    
    return {
        backgroundImageUrl: backgroundImageUrl,
        
        activate: function() {
            $('.bannerAvatar img').attr( 'src', "" );
            getBackgroundImage();
        },
        
        detached: function() {
            $('#fileupload').fileupload('destroy');
        },
        
        compositionComplete: function( _view ) {
	    view = _view;
            
            $('.bannerAvatar img').attr( 'src', "/services/user/avatar?uid=-&x=120&y=120" );
            
            // jqueryFileUpload
            // avatar
	    $(view).find(".bannerAvatar").on( 'click', function() {
		$(view).find(".avatarUpload").click();
	    });
	    $(view).find(".avatarUpload").fileupload({
                options: {
                    acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i
                },
		dataType: 'json',
		start: function() {
                    // show spinner
		    $(".bannerAvatar div i").css( 'visibility', 'visible' );
		},
		done: function(e, data) {
                    // hide spinner
                    $(".bannerAvatar div i").css( 'visibility', 'hidden' );
                    
                    $('.bannerAvatar img').attr( 'src', "/services/user/avatar?uid=-&x=120&y=120" );
                    $('#userNamePicNav .avatar img').attr( 'src', "/services/user/avatar?uid=-&x=37&y=37" );
                    
                    // check to see if the image src already has a zoom parameter in it, if so then take it out - this is used to ensure that the
                    // new image is shown. The src needs to be different than before
                    /*if( $('.bannerAvatar img').attr( 'src' ) == "/services/user/avatar?uid=-&zoom=0&x=120&y=120" ) {
                        // update image
                        $('.bannerAvatar img').attr( 'src', "/services/user/avatar?uid=-&x=120&y=120" );
                    } else {
                        // update image
                        $('.bannerAvatar img').attr( 'src', "/services/user/avatar?uid=-&zoom=0&x=120&y=120" );
                    }
                    
                    // check to see if the image src already has a zoom parameter in it, if so then take it out - this is used to ensure that the
                    // new image is shown. The src needs to be different than before
                    if( $('#userNamePicNav .avatar img').attr( 'src' ) == "/services/user/avatar?uid=-&zoom=0&x=37&y=37" ) {
                        // update header image
                        $('#userNamePicNav .avatar img').attr( 'src', "/services/user/avatar?uid=-&x=37&y=37" );
                    } else {
                        // update header image
                        $('#userNamePicNav .avatar img').attr( 'src', "/services/user/avatar?uid=-&zoom=0&x=37&y=37" );
                    }*/
		}
	    });
            
            
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
                }
            });
            
            // album cover photo
            $('.albumCoverUpload').fileupload({
                options: {
                    acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i
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
                    backgroundImageUrl( data.result[0].views.banner[0].url );
                }
            });
            
            app.trigger( 'coverphoto:composed', this );
	}
    
    };
});