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
        backgroundImageUrl( album.views.banner ? album.views.banner.url : null );
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
            getBackgroundImage();
        },
        
        detached: function() {
            $('#fileupload').fileupload('destroy');
        },
        
        compositionComplete: function( _view ) {
	    view = _view;
            
            // jqueryFileUpload
            // avatar
	    $(view).find(".bannerAvatar").on( 'click', function() {
		$(view).find(".avatarUpload").click();
	    });
	    $(view).find(".avatarUpload").fileupload({
		dataType: 'json',
		start: function() {
		    $(".bannerAvatar div i").css( 'visibility', 'visible' );
		},
		done: function(e, data) {
                    console.log( e, data );
		    /*$('<img class="newPic">').load( function() {
			$(".bannerAvatar img").replaceWith( data );
			$(".bannerAvatar div i").css( 'visibility', 'hidden' );
		    }).attr( 'src', "/services/user/avatar?uid=-&y=120" );*/
                    
                    $(".bannerAvatar div i").css( 'visibility', 'hidden' );
                    $('.bannerAvatar img').attr( 'src', "/services/user/avatar?uid=-&y=120" );
		}
	    });
            
            // cover photo
            $(".editIcon-Wrap").on( 'click', function() {
		$(".coverUpload").click();
	    });
            $('.coverUpload').fileupload({
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
                    if( albumOrUser() == "album" ) {
                        
                        // This section needs work
                        
                        var aid = currentAlbum().uuid;
                        var file = data.files[0];
                        var xhr = new XMLHttpRequest();
                        xhr.open("POST", '/services/user/add_or_replace_banner_photo', false ); // sync!
                        xhr.setRequestHeader('Final-Length', file.size );
                        xhr.send( JSON.stringify( {aid: aid, file:{Path:file.name} } ) );
                    } else {
                        data.submit();
                    }
                },
                done: function (e, data) {
                    console.log( data );
                    backgroundImageUrl( data.result[0].views.banner.url );
                }
            });    
            
            app.trigger( 'coverphoto:composed', this );
	}
    
    };
});