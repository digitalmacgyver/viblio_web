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
            console.log( user );
            if( user.banner_uuid ) {
                viblio.api('services/mediafile/get', user.banner_uuid).then( function( res ) {
                    console.log( res );
                    backgroundImageUrl( res );
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
		    $('<img class="newPic">').load( function() {
			$(".bannerAvatar img").replaceWith( data );
			$(".bannerAvatar div i").css( 'visibility', 'hidden' );
		    }).attr( 'src', "/services/user/avatar?uid=-&y=120" );
		}
	    });
            
            // cover photo
            $(view).find(".bannerEdit-Wrap").on( 'click', function() {
		//$(view).find(".coverUpload").click();
	    });
	    /*$(view).find(".coverUpload").fileupload({
		//dataType: 'json',
		add: function (e, data) {
                    console.log( e, data );
                    var args = data.value;
                    data.process().done(function() {
			return $(this).fileupload('process', data);
                    }).always(function( data ) {
                        viblio.api( "/services/user/add_or_replace_banner_photo/", data ).then( function( res ) {
                            console.log( res );
                        });
                    });
                },
                change: function (e, data) {
                    $.each(data.files, function (index, file) {
                        alert('Selected file: ' + file.name);
                    });
                },
                done: function(e, data) {
                    console.log( data );
                }
	    });*/
            $('.coverUpload').fileupload({
                /*change: function (e, data) {
                    $.each(data.files, function (index, file) {
                        alert('Selected file: ' + file.name);
                    });
                },*/
                add: function (e, data) {
                    data.submit();
                }
            });
            
            /*$('.randomInput').bind('change', function (e) {
                console.log( $(this) );
                $('.coverUpload').fileupload('add', {
                    fileInput: $(this)
                });
            });*/
            
            
            
            
                
            // Change this to the location of your server-side upload handler:
            /*var url = 'https://staging.viblio.com/services/user/add_or_replace_banner_photo/';
            $('#fileupload').fileupload({
                url: url,
                dataType: 'json',
                done: function (e, data) {
                    $.each(data.result.files, function (index, file) {
                        $('<p/>').text(file.name).appendTo('#files');
                    });
                },
                progressall: function (e, data) {
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $('#progress .progress-bar').css(
                        'width',
                        progress + '%'
                    );
                }
            }).prop('disabled', !$.support.fileInput)
                .parent().addClass($.support.fileInput ? undefined : 'disabled');*/
        
            /*jslint unparam: true, regexp: true */
            /*global window, $ */
            'use strict';
            // Change this to the location of your server-side upload handler:
            var url = 'https://staging.viblio.com/services/user/add_or_replace_banner_photo/',
                uploadButton = $('<button/>')
                    .addClass('btn btn-primary')
                    .prop('disabled', true)
                    .text('Processing...')
                    .on('click', function () {
                        var $this = $(this),
                            data = $this.data();
                        $this
                            .off('click')
                            .text('Abort')
                            .on('click', function () {
                                $this.remove();
                                data.abort();
                            });
                        data.submit().always(function () {
                            $this.remove();
                        });
                    });
            $('#fileupload').fileupload({
                url: url,
                dataType: 'json',
                autoUpload: false,
                acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                maxFileSize: 5000000, // 5 MB
                // Enable image resizing, except for Android and Opera,
                // which actually support image resizing, but fail to
                // send Blob objects via XHR requests:
                disableImageResize: /Android(?!.*Chrome)|Opera/
                    .test(window.navigator.userAgent),
                previewMaxWidth: 100,
                previewMaxHeight: 100,
                previewCrop: true
            }).on('fileuploadadd', function (e, data) {
                data.context = $('<div/>').appendTo('#files');
                $.each(data.files, function (index, file) {
                    var node = $('<p/>')
                            .append($('<span/>').text(file.name));
                    if (!index) {
                        node
                            .append('<br>')
                            .append(uploadButton.clone(true).data(data));
                    }
                    node.appendTo(data.context);
                });
            }).on('fileuploadprocessalways', function (e, data) {
                var index = data.index,
                    file = data.files[index],
                    node = $(data.context.children()[index]);
                if (file.preview) {
                    node
                        .prepend('<br>')
                        .prepend(file.preview);
                }
                if (file.error) {
                    node
                        .append('<br>')
                        .append($('<span class="text-danger"/>').text(file.error));
                }
                if (index + 1 === data.files.length) {
                    data.context.find('button')
                        .text('Upload')
                        .prop('disabled', !!data.files.error);
                }
            }).on('fileuploadprogressall', function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#progress .progress-bar').css(
                    'width',
                    progress + '%'
                );
            }).on('fileuploaddone', function (e, data) {
                $.each(data.result.files, function (index, file) {
                    if (file.url) {
                        var link = $('<a>')
                            .attr('target', '_blank')
                            .prop('href', file.url);
                        $(data.context.children()[index])
                            .wrap(link);
                    } else if (file.error) {
                        var error = $('<span class="text-danger"/>').text(file.error);
                        $(data.context.children()[index])
                            .append('<br>')
                            .append(error);
                    }
                });
            }).on('fileuploadfail', function (e, data) {
                $.each(data.files, function (index) {
                    var error = $('<span class="text-danger"/>').text('File upload failed.');
                    $(data.context.children()[index])
                        .append('<br>')
                        .append(error);
                });
            }).prop('disabled', !$.support.fileInput)
                .parent().addClass($.support.fileInput ? undefined : 'disabled');
                
            
            
            app.trigger( 'coverphoto:composed', this );
	}
    
    };
});