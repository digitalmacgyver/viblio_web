define( ['durandal/app', 
	 'lib/viblio',
         'durandal/events',
         'viewmodels/header',
         'viewmodels/conditional_header',
         'viewmodels/hp',
         'lib/customDialogs'], 
function(app, viblio, Events, header, c_header, hp, dialogs) {
    
    var albumBackgroundImageUrl = ko.observable();
    var userBackgroundImageUrl = ko.observable();
    var albumOrUser = ko.observable("user");
    var currentAlbum = ko.observable( null );
    var avatar = ko.observable(null);
    var user = viblio.user();
    var hideEdit = ko.observable(null); /* controls visibility on the change avatar button */
    var hideCoverEdit = ko.observable(null); /* controls visibility on the cover edit button */
    var busyFlag = ko.observable( false );
    var hpFlag = ko.computed( function() {
        if( hp.nhome().isActiveFlag() ) {
            return true;
        } else {
            return false;
        }
    });
    var backgroundImageExists = ko.computed( function() {
        if( albumOrUser() == "album" ) {
            if( albumBackgroundImageUrl() ) {
                return true;
            } else {
                return false;
            }
        } else if( albumOrUser() == "user" ) {
            if( userBackgroundImageUrl() ) {
                return true;
            } else {
                return false;
            }
        }
    });
    
    var editExpanded = ko.observable( false );
    var view;
    
    var maxFileSize = 1000000; //1MB
    var acceptFileTypes = /(\.|\/)(gif|jpe?g|png)$/i; 
    
    app.on( 'albumList:gotalbum', function( album ) {
        albumOrUser( 'album' );
        currentAlbum( album );
        var photos = getAlbumPhotos();
        albumBackgroundImageUrl( album.views.banner ? album.views.banner.url : null );
        handleBackstretch( photos );
        // the album is shared with the user so show the owner's avatar
        if( album.owner_uuid != user.uuid ) {
            hideEdit( true );
            hideCoverEdit( true );
            avatar( "/services/user/avatar?uid=" + album.owner_uuid + "&x=120&y=120" );
        }
        // else it's owned by the viewer, so show the user's avatar
        else {
            hideEdit( false );
            hideCoverEdit( false );
            avatar( "/services/user/avatar?uid=-&x=120&y=120&ignore="+new Date() );
        }
    });
    
    app.on( 'newHome:filtersAreActive', function( media ) {
        var photos = [];
        albumOrUser( 'user' );
        if( media ) {
            media.forEach( function( vid ) {
                if( vid.views.image && vid.views.image.length > 0 ) {
                    vid.views.image.forEach( function( image ) {
                        photos.push( image.url );
                    });
                }
            });
        }
        
        //backgroundImageUrl( null );
        handleBackstretch( photos );
    });
    
    app.on( 'albumList:notactive', function() {
        albumOrUser( 'user' );
        currentAlbum( null );
        hideCoverEdit( false );
        getBackgroundImage();
    });
    
    app.on( 'newHome:noFiltersAreActive', function( media ) {
        albumOrUser( 'user' );
        currentAlbum( null );
        getBackgroundImage();
    });
    
    app.on( 'selectedFace:active', function( face ) {
        hideEdit( true );
        avatar( face.url );
    });
    
    app.on( 'selectedFace:notactive', function() {
        // only revert back to the user avatar if not in an album owned by another user
        //if( albumOrUser() == 'user' ) {
            if( currentAlbum() ) {
                if( currentAlbum().owner_uuid == user.uuid) {
                    hideEdit( false );
                    avatar( "/services/user/avatar?uid=-&x=120&y=120&ignore="+new Date() );
                }
            } else {
                hideEdit( false );
                avatar( "/services/user/avatar?uid=-&x=120&y=120&ignore="+new Date() );
            }
        //}
    });
    
    Events.includeIn( this );
    
    function getAlbumPhotos() {
        var photos = [];
        currentAlbum().media.forEach( function( vid ) {
            if( vid.views.image && vid.views.image.length > 0 ) {
                vid.views.image.forEach( function( image ) {
                    photos.push( image.url );
                });
            }
        });
        if( photos.length > 0 ) {
            return photos;
        } else {
            return null;
        }
    }
    
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
        if( albumOrUser() == "user" ) {
            if( userBackgroundImageUrl() ) {
                $('.bannerImage').backstretch( userBackgroundImageUrl() );
            } else {
                if( $('.bannerImage').data('backstretch') ) {
                    $('.bannerImage').backstretch("destroy", false);
                }

                if( photos && photos.length > 0 ) {
                    $('.bannerImage').backstretch( photos );
                } else {
                    $('.bannerImage').attr("style", null);
                }
            }
        } 
        // it's an album
        else {
            if( albumBackgroundImageUrl() ) {
                $('.bannerImage').backstretch( albumBackgroundImageUrl() );
            } else {
                if( $('.bannerImage').data('backstretch') ) {
                    $('.bannerImage').backstretch("destroy", false);
                }

                if( photos && photos.length > 0 ) {
                    $('.bannerImage').backstretch( photos );
                } else {
                    $('.bannerImage').attr("style", null);
                }
            }
        }
    }
    
    function getBackgroundImage() {
        if( albumOrUser() == "user" && !userBackgroundImageUrl() ) {
            var args;
            
            if( user.banner_uuid ) {
                args = {
                    mid: user.banner_uuid
                };
                
                return viblio.api('services/mediafile/get', args).then( function( res ) {
                    userBackgroundImageUrl( res.media.views.banner.url );
                    handleBackstretch();
                });
            } else {
                // show the default background;
                userBackgroundImageUrl( null );
                if( $('.bannerImage').data('backstretch') ) {
                    $('.bannerImage').backstretch("destroy", false);
                }
                $('.bannerImage').attr("style", null);
            }
        } else {
            handleBackstretch();
        }
    }
    
    function removeCoverImage() {
        var args = {
            delete: 1
        }
        
        if( albumOrUser() == "album" ) {
            var aid = currentAlbum().uuid;
            args.aid = aid;
            
            viblio.api( 'services/album/add_or_replace_banner_photo', args ).then( function() {
                editExpanded( false );
                albumBackgroundImageUrl( null );
                var photos = getAlbumPhotos();
                handleBackstretch( photos );
            });
        } else {
            viblio.api( 'services/user/add_or_replace_banner_photo', args ).then( function() {
                editExpanded( false );
                user.banner_uuid = null;
                userBackgroundImageUrl( null );
                getBackgroundImage();
            });
        }
    }
    
    function addCoverImage() {
        if( editExpanded() ) {
            if( albumOrUser() == "album" ) {
                $(".albumCoverUpload").click();
            } else {
                $(".userCoverUpload").click();
            }
        }
    }
    
    return {
        albumBackgroundImageUrl: albumBackgroundImageUrl,
        userBackgroundImageUrl: userBackgroundImageUrl,
        avatar: avatar,
        albumOrUser: albumOrUser,
        hideEdit: hideEdit,
        hideCoverEdit: hideCoverEdit,
        busyFlag: busyFlag,
        hpFlag: hpFlag,
        backgroundImageExists: backgroundImageExists,
        editExpanded: editExpanded,
        
        handleBackstretch: handleBackstretch,
        removeCoverImage: removeCoverImage,
        addCoverImage: addCoverImage,
        
        activate: function() {
            avatar( "/services/user/avatar?uid=-&x=120&y=120" );
            user = viblio.user();
            albumBackgroundImageUrl( null );
            userBackgroundImageUrl( null );
            getBackgroundImage();
        },
        
        detached: function() {
            $('.avatarUpload').fileupload('destroy');
            $('.albumCoverUpload').fileupload('destroy');
            $('.userCoverUpload').fileupload('destroy');
            $(document).off( 'click.coverPhoto' );
            $(document).off( 'click.coverPhoto' );
            
            // clean up backstretch
            if( $('.bannerImage').data('backstretch') ) {
                $('.bannerImage').backstretch("destroy", false);
            }
        },
        
        compositionComplete: function( _view ) {
	    view = _view;
            
            // jqueryFileUpload
            // avatar
	    $(view).find(".changeBannerAvatar-Outerwrap").on( 'click', function() {
		$(view).find(".avatarUpload").click();
	    });
	    $(view).find(".avatarUpload").fileupload({
                acceptFileTypes: acceptFileTypes,
                maxFileSize: 500000, // 500 KB
                messages: {
                    maxNumberOfFiles: 'Please only upload one image.',
                    acceptFileTypes: 'Only image file types are uploadable.',
                    maxFileSize: 'This image is too large, we can only accept up to 500 KB.'
                },
		dataType: 'json',
                start: function() {
                    busyFlag( true );
                },
                add: function (e, data) {
                    var that = this;
		    data.process().done(function() {
			return $(that).fileupload('process', data);
                    }).always(function() {
                        // show the error
			if ( data.files.error ) {
                            var msg = data.files[0].name + ": " + data.files[0].error;
			    return dialogs.showModal( 'viewmodels/customBlankModal', msg );
			}
                        // upload the image
			else {
                            data.submit();
                        }
                    });
                },
		done: function(e, data) {
                    // update avatar in settings and the headers
                    avatar( null );
                    avatar( "/services/user/avatar?uid=-&x=120&y=120&ignore="+new Date() );
                    header.updateAvatar();
                    c_header.updateAvatar();
		}
	    })
               // prevent the input from grabbing file uploads on drag and drop 
              .bind('fileuploaddrop', function (e, data) { e.preventDefault(); })
              .bind('fileuploaddragover', function (e) { e.preventDefault(); });
            
            
            // cover photos - decide which input to use based on if the user is looking at an album or not
            $(".editIcon-Wrap").on( 'click.coverPhoto', function() {
                if( backgroundImageExists() ) {
                    editExpanded( true );
                } else {
                    if( albumOrUser() == "album" ) {
                        $(".albumCoverUpload").click();
                    } else {
                        $(".userCoverUpload").click();
                    }
                }
	    });
            // close the edit cover area button when it's clicked outside of
            $(document).on( 'click.coverPhoto', function (e) {
                var container = $(".editIcon-Wrap");

                if (!container.is(e.target) // if the target of the click isn't the container...
                    && container.has(e.target).length === 0) // ... nor a descendant of the container
                {
                    editExpanded( false );
                }
            });
            
            // user cover photo
            $('.userCoverUpload').fileupload({
                maxNumberOfFiles: 1,
                acceptFileTypes: acceptFileTypes,
                maxFileSize: maxFileSize, // 1MB
                messages: {
                    maxNumberOfFiles: 'Please only upload one image.',
                    acceptFileTypes: 'Only image file types are uploadable.',
                    maxFileSize: 'This image is too large, we can only accept up to 1MB (1000KB).'
                },
                start: function() {
                    busyFlag( true );
                },
                add: function (e, data) {
                    var that = this;
		    data.process().done(function() {
			return $(that).fileupload('process', data);
                    }).always(function() {
                        // show the error
			if ( data.files.error ) {
                            var msg = data.files[0].name + ": " + data.files[0].error;
			    return dialogs.showModal( 'viewmodels/customBlankModal', msg );
			}
                        // upload the image
			else {
                            data.submit();
                        }
                    });
                },
                done: function (e, data) {
                    userBackgroundImageUrl( data.result[0].views.banner.url );
                    viblio.user().banner_uuid = 
                    handleBackstretch();
                    // close edit button
                    editExpanded( false );
                    busyFlag( false );
                }
            })
              // prevent the input from grabbing file uploads on drag and drop       
              .bind('fileuploaddrop', function (e, data) { e.preventDefault(); })
              .bind('fileuploaddragover', function (e) { e.preventDefault(); });
            
            // album cover photo
            $('.albumCoverUpload').fileupload({
                maxNumberOfFiles: 1,
                acceptFileTypes: acceptFileTypes,
                maxFileSize: maxFileSize, // 1MB
                messages: {
                    maxNumberOfFiles: 'Please only upload one image.',
                    acceptFileTypes: 'Only image file types are uploadable.',
                    maxFileSize: 'This image is too large, we can only accept up to 1MB (1000KB).'
                },
                start: function() {
                    busyFlag( true );
                },
                add: function (e, data) {
                    var aid = currentAlbum().uuid;
                    data.formData = {
                        aid: aid,
                        upload: data.files[0]
                    };
                    
                    var that = this;
		    data.process().done(function() {
			return $(that).fileupload('process', data);
                    }).always(function() {
                        // show the error
			if ( data.files.error ) {
                            var msg = data.files[0].name + ": " + data.files[0].error;
			    return dialogs.showModal( 'viewmodels/customBlankModal', msg );
			}
                        // upload the image
			else {
                            data.submit();
                        }
                    });
                    
                },
                done: function (e, data) {
                    albumBackgroundImageUrl( data.result[0].views.banner.url );
                    handleBackstretch();
                    // close edit button
                    editExpanded( false );
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