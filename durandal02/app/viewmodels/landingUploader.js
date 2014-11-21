define( ['durandal/app',
         'plugins/router',
         'lib/config',
         'lib/viblio',
         'lib/customDialogs',
         'viewmodels/photoFinderAccountModal'], 
     
function( app, router, config, viblio, dialog, AccountModal ) {
        
    var UL = function() {
        var self = this;
        
        self.IE = (head.browser.ie && head.browser.version < 10);
        self.ios = head.browser.ios;
        
        self.element;
        
        self.uploader;
        
        self.user = viblio.user();
        self.wasLoggedIn = ko.observable();
        
        self.options = {
	    // Mostly for debug.  If null, then the viblio uuid for uploads
	    // will be obtained by the viblio.js plugin.  If not null, it
	    // is used.
	    uuid: ko.observable( null ),
	    //
	    // The endpoint of the Viblio upload server.  This should
	    // normally not be changed.  For developers, it may be useful
	    // to set this to https://staging.viblio.com/files.
	    // If null, it is derived by getting the endpoint from the
	    // viblio.js plugin.
	    endpoint: 'https://staging.viblio.com/files',
	    //
	    // The file types to accept.  Currently viblio only accepts
	    // video files.
	    accept: /(\.|\/)(3gp|avi|flv|m4v|mp4|mts|m2ts|mov|mpeg|mpg|ogg|swf|wmv)$/i,
	    //
	    // The maximum number of concurrent videos that can be uploaded
	    // in parallel.  Others will wait in a queue until a slot opens up.
	    concurrent: 1,
	    //
	    // The maximum video file size to accept, in bytes
	    maxFileSize: 10000000000, // 10G
	    minFileSize: 64 * 1024,  // 64Kb
	    //
	    // Whether to generate dynamic css classes that can be used to
	    // animate the dropzone.
	    dropzone_effects: true,
	    //
	    // Whether to display upload statistics during the upload.
	    display_stats: true,
	    //
	    // What to display when a video file has completed upload
	    done_message: 'Done, pending review',
	    //
	    // What to say when a video file upload is canceled
	    cancel_message: 'Canceled!',
	    pause_message: 'Paused...',
	    //
	    // What to say when a video file is waiting for a slot to upload
	    waiting_message: 'waiting...',
	    //
	    // When doing iframe transport (ie < 10), the message to
	    // display while the user is waiting for the upload to finish
	    iframe_wait_message: 'uploading...',
	    //
	    // For skinning, you can override the html template used to
	    // render the UI.
	    template: null,
	    //
	    // Added to the alert window when an alert is triggered
	    alert_class: 'alert-error',
	    //
	    // Added to the alert window when a notify is triggered
	    notify_class: 'alert-success',
	    //
	    // Validation error messages
            messages: {
                maxNumberOfFiles: 'Maximum number of files exceeded',
                acceptFileTypes: 'Only video file types are uploadable',
                maxFileSize: 'This video is too large, we can only accept up to 10Gb.',
                minFileSize: 'This video is too small to be a real video.  Please try to find the original.'
            },
            
            skip_faces: false,
            
            upload_to_album: false,
            album_to_upload_to: null
	};
        
        
    };
    
    UL.prototype._overall_bitrate = function( v ) {
        this.element.find('.vup-overall-bitrate').html(v);
    };

    UL.prototype._overall_percent = function( v ) {
        this.element.find('.vup-overall-percent').html(v);
    };

    UL.prototype._overall_size = function( v ) {
        this.element.find('.vup-overall-size').html(v);
    };

    UL.prototype._reset_stats = function() {
        this._overall_bitrate('0');
        this._overall_percent('0%');
        this._overall_size('0 / 0');
    };

    UL.prototype._formatFileSize = function (bytes) {
        if (typeof bytes !== 'number') {
            return '';
        }
        if (bytes >= 1000000000) {
            return (bytes / 1000000000).toFixed(2) + ' GB';
        }
        if (bytes >= 1000000) {
            return (bytes / 1000000).toFixed(2) + ' MB';
        }
        return (bytes / 1000).toFixed(2) + ' KB';
    };

    UL.prototype._formatBitrate = function (bits) {
        if (typeof bits !== 'number') {
            return '';
        }
        if (bits >= 1000000000) {
            return (bits / 1000000000).toFixed(2) + ' Gbit/s';
        }
        if (bits >= 1000000) {
            return (bits / 1000000).toFixed(2) + ' Mbit/s';
        }
        if (bits >= 1000) {
            return (bits / 1000).toFixed(2) + ' kbit/s';
        }
        return bits.toFixed(2) + ' bit/s';
    };

    UL.prototype._formatPercentage = function (floatValue) {
        return (floatValue * 100).toFixed(2) + ' %';
    };

    UL.prototype._fileName = function( data ) {
        return data.files[0].name;
    };

    UL.prototype._calculateProgress = function( data ) {
        var value;
        value = parseInt(data.loaded / data.total * 100, 10) || 0;
        return value + "%";
    };

    UL.prototype._createProgressBar = function( progress ) {
        return '<div class="bar" style="width: ' + progress + '">' + progress + '</div>';
    };

    UL.prototype._cancelUpload = function( index ) {
        var self = this;
        
        var files = this._vpfiles;
        if (files[index]) {
            if ( ! $(files[index].context).data('done') ) {
                if ( ! $(files[index].context).data('canceled') )
                    this._vpin_progress -= 1;
                $(files[index].context).data('canceled', true);
                if ( files[index].jqXHR ) {
                    files[index].jqXHR.abort();
                }
                else {
                    self.element.find('input[type=file]').data("blueimpFileupload")._trigger( 'fail', null, files[index] );
                }
                // Cancel the upload on the server side
                var sessionID = $(files[index].context).attr('sessionID');
                var endpoint = this.options.endpoint + '/' + sessionID;
                var xhr = new XMLHttpRequest();
                xhr.open("DELETE", endpoint, false ); // sync!
                xhr.send();
                files[index].jqXHR = null;
            }
        }
    };

    UL.prototype._cancelAllUploads = function() {
        var self = this;
        $(this._vpfiles).each(function(index, file) {
            self._cancelUpload(index);
        });
    };

    UL.prototype._pauseUpload = function( index ) {
        var files = this._vpfiles;
        if (files[index]) {
            if ( ! $(files[index].context).data('done') &&
                 ! $(files[index].context).data('canceled') ) {
                $(files[index].context).data('paused', true);
                if ( files[index].jqXHR ) {
                    files[index].jqXHR.abort();
                    files[index].jqXHR = null;
                }
            }
        }
    };

    UL.prototype._pauseAllUploads = function() {
        var self = this;
        $(this._vpfiles).each(function(index, file) {
            self._pauseUpload(index);
        });
    };

    UL.prototype._resumeUpload = function( index ) {
        var self = this;
        var files = self._vpfiles;
        if ( files[index] ) {
            if ( $(files[index].context).data('paused') ) {
                $(files[index].context).data('paused', false );
                var sessionID = $(files[index].context).attr('sessionID');
                var endpoint = this.options.endpoint + '/' + sessionID;
                $.ajax({
                    url: endpoint,
                    method: 'HEAD',
                    success: function( d, s, xhr ) {
                        var Offset = xhr.getResponseHeader( 'Offset' );
                        files[index].uploadedBytes = parseInt( Offset );
                        files[index].data = null;
                        files[index].submit();
                    },
                    error: function() {
                        self.element.find('input[type=file]').data("blueimpFileupload")._trigger( 'fail', null, files[index] );
                    }
                });
            }
        }
    };

    UL.prototype._resumeAllUploads = function() {
        var self = this;
        $(this._vpfiles).each(function(index, file) {
            self._resumeUpload(index);
        });
    };

    // Public method. Used to set the value of the skip_faces option to true.
    // This is used when creating the xhr header  
    UL.prototype.skip_faces = function() {
        this.options.skip_faces = true;
        //console.log( "uploader skip_faces: ", this.options.skip_faces );
    };

    // Public method. Used to set the value of the skip_faces option to false
    UL.prototype.do_not_skip_faces = function() {
        this.options.skip_faces = false;
        //console.log( "uploader skip_faces: ", this.options.skip_faces );
    };

    // Public method. Used to choose an album to uplaod the videos directly into
    // If there is an aid included then set 'upload_to_album' to true, else set to false
    UL.prototype.upload_to_album = function( album ) {
        if( album ) {
            this.options.upload_to_album = true;
            this.options.album_to_upload_to = album.uuid;
        } else {
            this.options.upload_to_album = false;
            this.options.album_to_upload_to = null;
        }

        //console.log( this.options.upload_to_album, this.options.album_to_upload_to );
    };

    // Public method.  Cancel all uploads in progress.  Might be called when
    // leaving a page.
    UL.prototype.cancel_all_uploads = function() {
        this._cancelAllUploads();
    };

    // Public method.  Returns 0 if there are no files in progress, non-zero
    // if there are.  Can be used to decide whether to leave the page (prompt
    // the user) if there is danger of losing uploads.
    UL.prototype.in_progress = function() {
        return this._vpin_progress;
    };

    UL.prototype.alert = function( msg, append ) {
        var elem = this.element;
        if ( append )
            elem.find('.vup-alert span').append(msg);
        else
            elem.find('.vup-alert span').html(msg);
        if ( this.options.notify_class )
            elem.find('.vup-alert span').removeClass( this.options.notify_class );
        if ( this.options.alert_class )
            elem.find('.vup-alert span').addClass( this.options.alert_class );
        // add the close x to the alert area, but only if it's not there yet to avoid dupes
        if( !elem.find('.vup-alert .alertCloseX').length ) {
            elem.find('.vup-alert span').prepend('<p class="alertCloseX">&times;</p>');
        }
        elem.find('.vup-alert').slideDown();
        elem.find('.vup-alert').on( 'click.vup', function() {
            elem.find('.vup-alert').slideUp(function() {
                elem.find('.vup-alert span').empty();
                elem.find('.vup-alert').unbind( 'click.vup' );
            });
        });
    };

    UL.prototype.notify = function( msg, append ) {
        var self = this; 
        var elem = this.element;
        if ( append )
            elem.find('.vup-alert span').append(msg);
        else
            elem.find('.vup-alert span').html(msg);
        if ( this.options.alert_class )
            elem.find('.vup-alert span').removeClass( this.options.alert_class );
        if ( this.options.notify_class )
            elem.find('.vup-alert span').addClass( this.options.notify_class );
        elem.find('.vup-alert').slideDown();
        elem.find('.vup-alert').on( 'click.vup', function() {
            elem.find('.vup-alert').slideUp(function() {
                elem.find('.vup-alert span').empty();
                elem.find('.vup-alert').unbind( 'click.vup' );
            });
        });
        
        $('#backHomeLink').on('click', function() {
            console.log( 'link was clicked' );
        });
    };

    UL.prototype.reset = function() {
        var self = this;
        self._vpfiles = [];
        self._vpin_progress = 0;
        self.BR = 0;
        self.BP = 0;
        self._reset_stats();
        self.element.find( '.vup-files' ).empty();
        self.element.find('.vup-instructions').css( 'visibility', 'visible' );
        //self.element.find('.vup-instructions').css( 'cursor', 'pointer' );
        //self.element.find('.vup-area').css( 'cursor', 'pointer' );
        if ( ! self.IE ) {
            self.element.find('.selectFilesButton').on( 'click.VUP-AREA', function() {
                self.element.find('input[type=file]').click();
            });
        }
    };

    UL.prototype._remove_droparea_click = function() {
        var self = this;
        if ( ! self.IE ) {
            self.element.find('.vup-area').unbind( 'click.VUP-AREA' );
            self.element.find('.vup-instructions').unbind( 'click.VUP-AREA' );
        }
        self.element.find('.vup-area').css( 'cursor', 'default' );
    };
    
    UL.prototype._destroy = function() {
        $(document).unbind( 'dragover.VUP drop.VUP' );
        this.element.find('input[type=file]').fileupload( 'destroy' );
    };
    
    UL.prototype.activate = function() {
        var self = this;
        
        console.log( "User info: ", self.user );
        
        if( !self.user.uuid ) {
            self.wasLoggedIn( false );
        } else {
            self.wasLoggedIn( true );
        }
    };
    
    UL.prototype.compositionComplete = function( view ) {
        var self = this;
        var elem = $(view);
        self.element = elem;
        
        console.log( elem );
        
        // setup the uploader
        if ( self.ios ) {
            // There is a BUG in IOS that prevents multiple file uploads.  See
            // https://github.com/blueimp/jQuery-File-Upload/issues/2627
            // https://github.com/moxiecode/plupload/issues/894
            $('<input class="uploaderInput" type="file" name="files[]" style="visibility: hidden; position: absolute; top: 0px; left: 0px; height: 0px; width: 0px;" />').appendTo( elem ).on('click', function(){
                console.log( 'input was clicked' );
            });
        }
        else if ( ! self.IE ) {
            console.log( 'should be appending input' );
            $('<input class="uploaderInput" type="file" name="files[]" style="visibility: hidden; position: absolute; top: 0px; left: 0px; height: 0px; width: 0px;" />').appendTo( elem );
        }
        elem.append( self.options.template );
        if ( self.options.display_stats )
            elem.find( '.vup-stats' ).css( 'visibility', 'visible' );

        self.reset();

        if ( self.IE ) {
            // Need to proxy the change of the input manually and 
            // initiate the file uploader.
            elem.find( 'input[type=file]' ).bind( 'change', function( e ) {
                elem.find('input[type=file]').fileupload( 'add', {
                    files: e.target.files || [{name: this.value}],
                    fileInput: $(this)
                });
            });
        }
        
        self.uploader = $(this).data("blueimpFileupload");
        
        elem.find('input[type=file]').fileupload({
            url: self.options.endpoint,
            type: 'PATCH',
            maxChunkSize: 1024 * 256,
            maxRetries: 15,
            retryTimeout: 1000,
            multipart: ( self.IE ? undefined : false ),
            fileInput: ( self.IE ? null : undefined ),
            forceIframeTransport: ( self.IE ? true : undefined ),
            dataType: 'text',
            dropZone: elem.find('.vup-area'),
            acceptFileTypes: self.options.accept,
            maxFileSize: self.options.maxFileSize,
            minFileSize: self.options.minFileSize,
            limitConcurrentUploads: self.options.concurrent,
            messages: self.options.messages,
            add: function(e, data) {
                var that = this;
                self._fu = this;
                
                console.log( that, self.uploader, $(this).data("blueimpFileupload") );
                
                function handleUpload() {
                    if( !data ) {
                        return;
                    }
                        
                    data.process().done(function() {
                        return $(that).fileupload('process', data);
                    }).always(function() {
                        if ( data.files.error ) {
                            var msg = data.files[0].error;
                            self.alert( self._fileName(data)+': '+msg+'<br/>', true );
                        }
                        else {
                            elem.find('.vup-instructions').css( 'visibility', 'hidden' );
                            self._remove_droparea_click();
                            self._vpin_progress += 1;

                            var progress = self._calculateProgress(data);
                            var filename = self._fileName(data);

                            // A count of the number of rows (current file uploads)
                            var index = elem.find(".vup-files tr").length;

                            // create a cancel button for this upload
                            var cancelButton = $('<a title="Cancel" href="javascript:;" class="vup-cancel-file"><i class="icon-remove"></i></a>');
                            cancelButton.data( 'file', index );
                            var pauseButton = $('<a title="Pause/Resume" href="javascript:;" class="vup-pause-file"><i class="icon-pause"></i></a>');
                            pauseButton.data( 'file', index );

                            // Get the context for this upload
                            //row = $(data.context[0]);

                            cancelButton.click( function() {
                                self._cancelUpload($(this).data( 'file' ));
                                cancelButton.remove();
                                pauseButton.remove();
                                row.find(".vup-file-progress-column .bar").removeClass( 'bar-warning' ).addClass( 'bar-danger' );
                            });

                            pauseButton.click( function() {
                                if ( $( self._vpfiles[$(this).data( 'file' )].context ).data('paused') ) {
                                    $(this).find('i').removeClass( 'icon-play' );
                                    $(this).find('i').addClass( 'icon-pause' );
                                    self._resumeUpload($(this).data( 'file' ));
                                    row.find(".vup-file-progress-column .bar").removeClass( 'bar-warning' );
                                }
                                else {
                                    $(this).find('i').removeClass( 'icon-pause' );
                                    $(this).find('i').addClass( 'icon-play' );
                                    self._pauseUpload($(this).data( 'file' ));
                                    row.find(".vup-file-progress-column .bar").addClass( 'bar-warning' );
                                }
                            });

                            // create new table row
                            var row = $('<tr><td class="w200"><div class="vup-filename-column"></div></td><td class="vup-file-progress-column"><div class="progress progress-striped"></div></td><td class="w50"><div class="vup-cancel-column"></div></td>');

                            // Do the initial viblio uploader HEAD to create the file and
                            // get back the file id
                            var uuid = self.options.uuid();
                            var file = data.files[0];
                            var endpoint = self.options.endpoint;
                            var xhr = new XMLHttpRequest();
                            xhr.open("POST", endpoint, false ); // sync!
                            xhr.setRequestHeader('Final-Length', file.size );
                            //console.log( JSON.stringify({uuid: uuid, file:{Path:file.name}, skip_faces: self.options.skip_faces, album_uuid: self.options.upload_to_album ? self.options.album_to_upload_to : null  }) );
                            xhr.send(JSON.stringify({uuid: uuid, file:{Path:file.name}, skip_faces: self.options.skip_faces, try_photos: true, album_uuid: self.options.upload_to_album ? self.options.album_to_upload_to : null  }));
                            if ( xhr.status != 200 && xhr.status != 201 ) {
                                $(row).find(".vup-filename-column").text(filename);
                                $(row).find(".progress").html('<div class="bar" style="width:100%;">Upload failed: ' + xhr.statusText + '</div>' );
                                // Add the new file upload row to our list (table) of file uploads
                                $(row).appendTo(elem.find(".vup-files"));
                                self._vpin_progress -= 1;
                            }
                            else {
                                var submit_url = xhr.getResponseHeader("Location");
                                var sessionID = submit_url.split('/').pop();

                                $(row).find(".vup-filename-column").text(filename);
                                if ( ! self.IE )
                                    $(row).find(".progress").html('<div class="bar" style="width:0%;">' + self.options.waiting_message + '</div>' );
                                else
                                    $(row).find(".vup-progress-progress-column").html('<div class="bar" style="width:0%;">' + self.options.iframe_wait_message + '</div>' );
                                $(row).find(".vup-cancel-column").append(cancelButton);
                                if ( ! self.IE )
                                    $(row).find(".vup-cancel-column").append(pauseButton);
                                $(row).attr("sessionID", sessionID);
                                $(row).attr("offset", 0 );

                                // Add the new file upload row to our list (table) of file uploads
                                $(row).appendTo(elem.find(".vup-files"));

                                // Assign this row to this upload's context
                                data.context = row;

                                // Add this upload data to our files container
                                data.finished = false;
                                self._vpfiles.push( data );

                                self.element.find('input[type=file]').data("blueimpFileupload")._trigger( 'started', null, null );
                                data.submit();
                            }
                        }
                    });
                }
                
                var AM = new AccountModal();
                if( !self.user.uuid ) {
                    app.showDialog( AM ).then( function( user ) {
                        if( !user || !user.uuid ) {
                            elem.find('.vup-instructions').css( 'visibility','visible');
                            return;
                        } else {
                            self.options.uuid( user.uuid );
                            handleUpload();
                        }
                    });
                } else {
                    self.options.uuid( self.user.uuid );
                    handleUpload();
                }
                
            },
            done: function(e, data) {
                $(data.context[0]).data( 'done', true );
                self._vpin_progress -= 1;
                self.element.find('input[type=file]').data("blueimpFileupload")._trigger( 'completed', null, null );
                if ( self._vpin_progress == 0 || self.IE ) {
                    self.element.find('input[type=file]').data("blueimpFileupload")._trigger( 'finished', null, null );
                    self.notify( 'Videos take a little while to process.<br />\n\
                                  <b>We\'ll send an email to the email address you entered when your pictures are ready with a link for where you can see them.</b><br/>\n\
                                  <em>Your video and photos will be stored in a private account where only you can access them.</em>\n\
                                  <br /><a id="backHomeLink" class="btn btn-primary" href="/signup/">Got it</a>' );
                    elem.find( '.vup-cancel-column').empty();
                    // log the user out
                    if( !self.wasLoggedIn() ) {
                        viblio.api( '/services/na/logout' ).then( function() {
                            viblio.setUser( null );
                        });
                    }
                }
                data.context.find(".vup-file-progress-column .bar").html( self.options.done_message ).addClass( 'vup-file-done bar-success' );
                var row = $(data.context[0]);
                row.find( '.vup-cancel-column').empty();
            },
            progress: function(e, data) {
                var progress;
                //data.context.removeData("retries");
                progress = self._calculateProgress(data);
                data.context.find(".vup-file-progress-column .progress").html(self._createProgressBar(progress));
                $(data.context).attr("offset", data.loaded);
            },
            progressall: function (e, data) {
                self.BR += data.bitrate;
                self.BP += 1;
                var ave = self.BR / self.BP;

                self._overall_bitrate( self._formatBitrate(ave) );
                self._overall_percent( self._formatPercentage( data.loaded / data.total ) );
                self._overall_size( self._formatFileSize(data.loaded) + ' / ' + self._formatFileSize(data.total) );
            },
            beforeSend: function(e, files, index, xhr, handler, callback) {
                var chrome, context, device, file, filename, filesize, ios, sessionID, offset;

                // Retrieve the file that is about to be sent to nginx
                file = files.files[0];

                // Collect some basic file information
                filename = file.name;
                filesize = file.size;

                // Grab the context (table row) for this upload
                context = files.context[0];

                // Get the generated sessionID for this upload
                sessionID = $(context).attr("sessionID");
                //offset = $(context).attr("offset");
                offset = files.uploadedBytes;

                files.url += '/' + sessionID;

                // Set uploadedBytes on the context to ensure that if this upload was
                // resumed, it will continue from where it left off.
                $(context).attr("uploadedBytes", files.uploadedBytes);

                // Set the required headers for the nginx upload module
                e.setRequestHeader("Offset", offset);
                if ( ! head.browser.ie )
                    e.setRequestHeader("Content-type", "application/offset+octet-stream" );
                e.setRequestHeader("X-Requested-With", "XMLHttpRequest");

                device = navigator.userAgent.toLowerCase();
                ios = device.match(/(iphone|ipod|ipad)/);
                chrome = device.match(/crios/);

                if (ios && !chrome) {
                    e.setRequestHeader("Cache-Control", "no-cache");
                }
            },
            fail: function(e, data) {
                var maxRetries, retryCount, retryTimeout, row;

                // Get the context for this upload
                row = $(data.context[0]);

                if ( row.data( 'canceled' ) ) {
                    row.find( '.vup-cancel-column').empty();
                    row.find(".vup-file-progress-column .bar").html(self.options.cancel_message);
                    row.find(".vup-file-progress-column .bar").css( 'width', '100%' );
                    row.find(".vup-file-progress-column .bar").addClass( 'vup-file-done' );
                    return;
                }
                else if ( row.data( 'paused' ) ) {
                    row.find(".vup-file-progress-column .bar").html(self.options.pause_message);
                    row.find(".vup-file-progress-column .bar").addClass( 'vup-file-paused' );
                    return;
                }

                // Grab its current retry count
                retryCount = row.data("retries") || 1;
                var filename = row.find(".vup-filename-column").text();

                // Get our maxRetries and retryTimeout settings
                maxRetries = $(this).data("blueimpFileupload").options.maxRetries + 1;
                retryTimeout = $(this).data("blueimpFileupload").options.retryTimeout;

                // If we can still attempt a retry
                if (retryCount < maxRetries) {
                    // Set the row's progress bar section to display that we are trying again
                    row.find(".vup-file-progress-column .bar").html("Retry&nbsp;#" + retryCount + '/' + (maxRetries-1) );
                    window.setTimeout(function() {

                        // Increment the retry count and set it back on the row
                        retryCount += 1;
                        row.data("retries", retryCount );

                        // Reassign the uploadedBytes, then submit to start the upload again.
                        data.uploadedBytes = parseInt(row.attr("uploadedBytes"), 10);
                        data.data = null;
                        $(data).submit();
                    }, retryCount * retryTimeout);

                } else {
                    // We've met our retry limit. Indicate that this upload has failed.
                    row.find(".vup-file-progress-column .bar").html("Bummer, I failed to get to the server.  Try again later?");
                    row.find(".vup-file-progress-column .bar").css( 'width', '100%' );
                    row.find(".vup-file-progress-column .bar").addClass( 'vup-file-done bar-danger' );
                    row.find( '.vup-cancel-column').empty();
                    self._vpin_progress -= 1;
                }
            }
        });
        if ( self.options.dropzone_effects ) {
            $(document).bind('dragover.VUP', function (e) {
                e.preventDefault();
                elem.find('.vup-instructions').css( 'visibility','hidden');
                var dropZone = elem.find('.vup-area' );
                var timeout = window.dropZoneTimeout;
                if (!timeout) {
                    dropZone.addClass('in');
                } else {
                    clearTimeout(timeout);
                }
                var found = false,
                node = e.target;
                do {
                    if (node === dropZone[0]) {
                        found = true;
                        break;
                    }
                    node = node.parentNode;
                } while (node != null);
                if (found) {
                    dropZone.addClass('hover');
                } else {
                    dropZone.removeClass('hover');
                }
                window.dropZoneTimeout = setTimeout(function () {
                    window.dropZoneTimeout = null;
                    dropZone.removeClass('in hover');
                }, 100);
            });
            
            $(document).bind('drop.VUP', function (e) {
                e.preventDefault();
                
                console.log( 'drop fired', self.options.uuid );
                
                if( !self.options.uuid() ) {
                    elem.find('.vup-instructions').css( 'visibility','visible');
                }
            });
        }
    };

    return UL;
});