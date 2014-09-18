(function($) {

    var IE = (head.browser.ie && head.browser.version < 10);
    var ios = head.browser.ios;

    $.widget( 'viblio.viblio_uploader', {
	options: {
	    // Mostly for debug.  If null, then the viblio uuid for uploads
	    // will be obtained by the viblio.js plugin.  If not null, it
	    // is used.
	    uuid: null,
	    //
	    // The endpoint of the Viblio upload server.  This should
	    // normally not be changed.  For developers, it may be useful
	    // to set this to https://staging.viblio.com/files.
	    // If null, it is derived by getting the endpoint from the
	    // viblio.js plugin.
	    endpoint: null,
	    //
	    // The file types to accept.  Currently viblio only accepts
	    // video files.
	    accept: /(\.|\/)(3gp|avi|flv|m4v|mp4|mts|m2ts|mov|mpeg|mpg|ogg|swf|wmv)$/i,
	    //
	    // The maximum number of concurrent videos that can be uploaded
	    // in parallel.  Others will wait in a queue until a slot opens up.
	    concurrent: 4,
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
	},

	_overall_bitrate: function( v ) {
	    this.element.find('.vup-overall-bitrate').html(v);
	},

	_overall_percent: function( v ) {
	    this.element.find('.vup-overall-percent').html(v);
	},

	_overall_size: function( v ) {
	    this.element.find('.vup-overall-size').html(v);
	},

	_reset_stats: function() {
            this._overall_bitrate('0');
            this._overall_percent('0%');
            this._overall_size('0 / 0');
	},

	_formatFileSize: function (bytes) {
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
	},

	_formatBitrate: function (bits) {
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
	},
	
	_formatPercentage: function (floatValue) {
            return (floatValue * 100).toFixed(2) + ' %';
	},

	_fileName: function( data ) {
	    return data.files[0].name;
	},

	_calculateProgress: function( data ) {
            var value;
            value = parseInt(data.loaded / data.total * 100, 10) || 0;
            return value + "%";
	},

	_createProgressBar: function( progress ) {
	    return '<span class="bar" style="width: ' + progress + '">' + progress + '</span>';
	},

	_cancelUpload: function( index ) {
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
			$(this._fu).data('blueimp-fileupload')._trigger( 'fail', null, files[index] );
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
	},

	_cancelAllUploads: function() {
	    var self = this;
            $(this._vpfiles).each(function(index, file) {
		self._cancelUpload(index);
            });
	},

	_pauseUpload: function( index ) {
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
	},

	_pauseAllUploads: function() {
	    var self = this;
            $(this._vpfiles).each(function(index, file) {
		self._pauseUpload(index);
            });
	},

	_resumeUpload: function( index ) {
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
			    $(self._fu).data('blueimp-fileupload')._trigger( 'fail', null, files[index] );
			}
		    });
		}
	    }
	},

	_resumeAllUploads: function() {
	    var self = this;
            $(this._vpfiles).each(function(index, file) {
		self._resumeUpload(index);
            });
	},
        
        // Public method. Used to set the value of the skip_faces option to true.
        // This is used when creating the xhr header  
        skip_faces: function() {
            this.options.skip_faces = true;
            //console.log( "uploader skip_faces: ", this.options.skip_faces );
        },
        
        // Public method. Used to set the value of the skip_faces option to false
        do_not_skip_faces: function() {
            this.options.skip_faces = false;
            //console.log( "uploader skip_faces: ", this.options.skip_faces );
        },
        
        // Public method. Used to choose an album to uplaod the videos directly into
        // If there is an aid included then set 'upload_to_album' to true, else set to false
        upload_to_album: function( album ) {
            if( album ) {
                this.options.upload_to_album = true;
                this.options.album_to_upload_to = album.uuid;
            } else {
                this.options.upload_to_album = false;
                this.options.album_to_upload_to = null;
            }
            
            console.log( this.options.upload_to_album, this.options.album_to_upload_to );
        },

	// Public method.  Cancel all uploads in progress.  Might be called when
	// leaving a page.
	cancel_all_uploads: function() {
	    this._cancelAllUploads();
	},

	// Public method.  Returns 0 if there are no files in progress, non-zero
	// if there are.  Can be used to decide whether to leave the page (prompt
	// the user) if there is danger of losing uploads.
	in_progress: function() {
	    return this._vpin_progress;
	},
        
	alert: function( msg, append ) {
	    var elem = this.element;
	    if ( append )
		elem.find('.vup-alert span').append(msg);
	    else
		elem.find('.vup-alert span').html(msg);
	    if ( this.options.notify_class )
		elem.find('.vup-alert span').removeClass( this.options.notify_class );
	    if ( this.options.alert_class )
		elem.find('.vup-alert span').addClass( this.options.alert_class );
	    elem.find('.vup-alert').slideDown();
	    elem.find('.vup-alert').on( 'click.vup', function() {
		elem.find('.vup-alert').slideUp(function() {
		    elem.find('.vup-alert span').empty();
		    elem.find('.vup-alert').unbind( 'click.vup' );
		});
	    });
	},

	notify: function( msg, append ) {
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
                self._trigger( 'close', null, null );
            });
	},

	reset: function() {
	    var self = this;
	    self._vpfiles = [];
	    self._vpin_progress = 0;
	    self.BR = 0;
	    self.BP = 0;
	    self._reset_stats();
	    self.element.find( '.vup-files' ).empty();
	    self.element.find('.vup-instructions').css( 'visibility', 'visible' );
	    self.element.find('.vup-instructions').css( 'cursor', 'pointer' );
	    self.element.find('.vup-area').css( 'cursor', 'pointer' );
	    if ( ! IE ) {
		self.element.find('.vup-area').on( 'click.VUP-AREA', function() {
		    self.element.find('input[type=file]').click();
		});
		self.element.find('.vup-instructions').on( 'click.VUP-AREA', function() {
		    self.element.find('input[type=file]').click();
		});
	    }
	},

	_remove_droparea_click: function() {
	    var self = this;
	    if ( ! IE ) {
		self.element.find('.vup-area').unbind( 'click.VUP-AREA' );
		self.element.find('.vup-instructions').unbind( 'click.VUP-AREA' );
	    }
	    self.element.find('.vup-area').css( 'cursor', 'default' );
	},

	_create: function() {
	    var self = this;
	    var elem = self.element;
            
	    self.options.uuid = self.options.uuid || viblio.vid();
	    self.options.endpoint = self.options.endpoint || viblio.service('/files');
	    if ( ios ) {
		// There is a BUG in IOS that prevents multiple file uploads.  See
		// https://github.com/blueimp/jQuery-File-Upload/issues/2627
		// https://github.com/moxiecode/plupload/issues/894
		$('<input type="file" name="files[]" style="visibility: hidden; position: absolute; top: 0px; left: 0px; height: 0px; width: 0px;" />').appendTo( elem );
	    }
	    else if ( ! IE ) {
		$('<input type="file" name="files[]" style="visibility: hidden; position: absolute; top: 0px; left: 0px; height: 0px; width: 0px;" multiple />').appendTo( elem );
	    }
	    elem.append( self.options.template || self._html( IE ) );
	    if ( self.options.display_stats )
		elem.find( '.vup-stats' ).css( 'visibility', 'visible' );

	    self.reset();
            
	    if ( IE ) {
		// Need to proxy the change of the input manually and 
		// initiate the file uploader.
		elem.find( 'input[type=file]' ).bind( 'change', function( e ) {
		    elem.find('input[type=file]').fileupload( 'add', {
			files: e.target.files || [{name: this.value}],
			fileInput: $(this)
		    });
		});
	    }
	    
            elem.find('input[type=file]').fileupload({
		url: self.options.endpoint,
                type: 'PATCH',
                maxChunkSize: 1024 * 256,
                maxRetries: 15,
                retryTimeout: 1000,
                multipart: ( IE ? undefined : false ),
		fileInput: ( IE ? null : undefined ),
		forceIframeTransport: ( IE ? true : undefined ),
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

			    if ( index == 0 ) {
				// first time here, add the global cancel/pause buttons
				var allCancelButton = $('<a title="Cancel ALL" href="#" class="vup-cancel-file"><i class="icon-remove"></i></a>');
				var allPauseButton = $('<a title="Pause/Resume ALL" href="#" class="vup-pause-file"><i class="icon-pause"></i></a>');

				allCancelButton.click( function() {
				    self._cancelAllUploads();
				    allCancelButton.remove();
				    allPauseButton.remove();
				});

				allPauseButton.click( function() {
				    if ( $(this).data('paused') ) {
					$(this).data( 'paused', false );
					$('.vup-pause-file i').removeClass( 'icon-play' );
					$('.vup-pause-file i').addClass( 'icon-pause' );
					self._resumeAllUploads();
				    }
				    else {
					$(this).data( 'paused', true );
					$('.vup-pause-file i').removeClass( 'icon-pause' );
					$('.vup-pause-file i').addClass( 'icon-play' );
					self._pauseAllUploads();
				    }
				});
				var row = $('<tr><td class="vup-filename-column"></td><td class="vup-file-progress-column"></td><td class="vup-cancel-column"></td>');
				$(row).find(".vup-cancel-column").append(allCancelButton);
				if ( ! IE )
				    $(row).find(".vup-cancel-column").append(allPauseButton);
				$(row).appendTo(elem.find(".vup-files"));				
			    }
			    else {
				// account for the first row which contains the global buttons
				index -= 1;
			    }
			    
			    // create a cancel button for this upload
			    var cancelButton = $('<a title="Cancel" href="#" class="vup-cancel-file"><i class="icon-remove"></i></a>');
			    cancelButton.data( 'file', index );
			    var pauseButton = $('<a title="Pause/Resume" href="#" class="vup-pause-file"><i class="icon-pause"></i></a>');
			    pauseButton.data( 'file', index );

			    cancelButton.click( function() {
				self._cancelUpload($(this).data( 'file' ));
				cancelButton.remove();
				pauseButton.remove();
			    });

			    pauseButton.click( function() {
				if ( $( self._vpfiles[$(this).data( 'file' )].context ).data('paused') ) {
				    $(this).find('i').removeClass( 'icon-play' );
				    $(this).find('i').addClass( 'icon-pause' );
				    self._resumeUpload($(this).data( 'file' ));
				}
				else {
				    $(this).find('i').removeClass( 'icon-pause' );
				    $(this).find('i').addClass( 'icon-play' );
				    self._pauseUpload($(this).data( 'file' ));
				}
			    });
			    
			    // create new table row
			    var row = $('<tr><td class="vup-filename-column"></td><td class="vup-file-progress-column"></td><td class="vup-cancel-column"></td>');
			    
			    // Do the initial viblio uploader HEAD to create the file and
			    // get back the file id
			    var uuid = self.options.uuid;
                            var file = data.files[0];
                            var endpoint = self.options.endpoint;
                            var xhr = new XMLHttpRequest();
                            xhr.open("POST", endpoint, false ); // sync!
                            xhr.setRequestHeader('Final-Length', file.size );
                            console.log( JSON.stringify({uuid: uuid, file:{Path:file.name}, skip_faces: self.options.skip_faces, album_uuid: self.options.upload_to_album ? self.options.album_to_upload_to : null  }) );
                            xhr.send(JSON.stringify({uuid: uuid, file:{Path:file.name}, skip_faces: self.options.skip_faces, album_uuid: self.options.upload_to_album ? self.options.album_to_upload_to : null  }));
			    if ( xhr.status != 200 && xhr.status != 201 ) {
				$(row).find(".vup-filename-column").text(filename);
				$(row).find(".vup-file-progress-column").html('<span class="bar" style="width:100%;">Upload failed: ' + xhr.statusText + '</span>' );
				// Add the new file upload row to our list (table) of file uploads
				$(row).appendTo(elem.find(".vup-files"));
				self._vpin_progress -= 1;
			    }
			    else {
				var submit_url = xhr.getResponseHeader("Location");
				var sessionID = submit_url.split('/').pop();

				$(row).find(".vup-filename-column").text(filename);
				if ( ! IE )
				    $(row).find(".vup-file-progress-column").html('<span class="bar" style="width:0%;">' + self.options.waiting_message + '</span>' );
				else
				    $(row).find(".vup-file-progress-column").html('<span class="bar" style="width:0%;">' + self.options.iframe_wait_message + '</span>' );
				$(row).find(".vup-cancel-column").append(cancelButton);
				if ( ! IE )
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
				
				self._trigger( 'started', null, null );
				data.submit();
			    }
			}
		    });
		},
		done: function(e, data) {
		    $(data.context[0]).data( 'done', true );
                    self._vpin_progress -= 1;
                    self._trigger( 'completed', null, null );
		    if ( self._vpin_progress == 0 || IE ) {
			self._trigger( 'finished', null, null );
			self.notify( 'Your uploaded videos are now being processed to find and bring out the magic! We\'ll send you an email when your videos are ready.\n\
                                      <br /><a id="backHomeLink" class="btn btn-primary" href="#home">Back to Home</a>' );
			elem.find( '.vup-cancel-column').empty();
		    }
                    data.context.find(".vup-file-progress-column .bar").html( self.options.done_message );
                    data.context.find(".vup-file-progress-column .bar").addClass( 'vup-file-done' );
                    var row = $(data.context[0]);
                    row.find( '.vup-cancel-column').empty();
                },
		progress: function(e, data) {
                    var progress;
                    //data.context.removeData("retries");
                    progress = self._calculateProgress(data);
                    data.context.find(".vup-file-progress-column").html(self._createProgressBar(progress));
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
			row.find(".vup-file-progress-column .bar").addClass( 'vup-file-done' );
                        row.find( '.vup-cancel-column').empty();
                        self._vpin_progress -= 1;
                    }
                }
	    });
	    if ( self.options.dropzone_effects ) {
		$(document).bind('dragover.VUP', function (e) {
		    elem.find('.vup-instructions').css( 'visibility','hidden');
		    var dropZone = elem.find('.vup-area' );
		    timeout = window.dropZoneTimeout;
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
	    }
	},

	_destroy: function() {
	    $(document).unbind( 'dragover.VUP' );
            this.element.find('input[type=file]').fileupload( 'destroy' );
	},

	_html: function( ie ) {
	    if ( ! ie ) 
		return ('\
      <div class="vup-instructions"><div><p class="line1">Drop videos here</p><p class="line2">(or click)</p><br><br><p class="line3">Upload videos one at a time if using an IPad, IPhone or Internet Explorer.</p></div></div>\
      <div class="vup-alert"><span class="alert"></span></div>\
      <div class="vup-area">\
	<table class="vup-files">\
	</table>\
      </div>\
      \
      <div class="vup-stats">\
	<table>\
	  <tr>\
            <td><span class="vup-data-point vup-overall-bitrate"></span></td>\
            <td><span class="vup-data-point vup-overall-percent"></span></td>\
            <td><span class="vup-data-point vup-overall-size"></span></td>\
	  </tr>\
	  <tr>\
            <td><span class="vup-data-title">Upload Speed</span></td>\
            <td><span class="vup-data-title">Percent Done</span></td>\
            <td><span class="vup-data-title">Data Uploaded</span></td>\
	  </tr>\
	</table>\
      </div>\
');
	    else 
		return ('\
      <div class="vup-instructions">\
        <div><p class="line1">Choose a file to upload</p><p class="ie-fileupload-input">\
          <form id="fileupload"><input type="file" name="files[]" /></form>\
        </p></div>\
      </div>\
      <div class="vup-alert"><span class="alert"></span></div>\
      <div class="vup-area">\
	<table class="vup-files">\
	</table>\
      </div>\
      \
');
		
	}
    });
})(jQuery);

