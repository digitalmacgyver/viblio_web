(function($) {
    $.widget( 'viblio.viblio_uploader', {
	options: {
	    uuid: '682DC812-05C3-11E3-839F-54DE3DA5649D',
	    endpoint: 'https://staging.viblio.com/files',
	    accept: /(\.|\/)(3gp|avi|flv|m4v|mp4|mts|mov|mpeg|mpg|ogg|swf|mwv)$/i,
	    concurrent: 4,
	    maxFileSize: 10000000000, // 10G
	    done_message: 'Done, pending review',
	    cancel_message: 'Canceled!',
            messages: {
                maxNumberOfFiles: 'Maximum number of files exceeded',
                acceptFileTypes: 'Only video file types are uploadable',
                maxFileSize: 'File is too large',
                minFileSize: 'File is too small'
            }
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
		$(files[index].context).data('canceled', true);
		if ( files[index].jqXHR ) {
                    files[index].jqXHR.abort();

                    // Cancel the upload on the server side
                    var sessionID = $(files[index].context).attr('sessionID');
                    var endpoint = this.options.endpoint + '/' + sessionID;
                    var xhr = new XMLHttpRequest();
                    xhr.open("DELETE", endpoint, false ); // sync!
                    xhr.send();
		}
		this._vpin_progress -= 1;
            }
	},

	_create: function() {
	    var self = this;
	    var elem = self.element;
	    self._vpfiles = [];
	    self._vpin_progress = 0;
	    elem.find('input[type=file]').bootstrapFileInput();
            elem.find('input[type=file]').fileupload({
		url: self.options.endpoint,
                type: 'PATCH',
                maxChunkSize: 1024 * 256,
                maxRetries: 15,
                retryTimeout: 1000,
                multipart: false,
                dataType: 'text',
                dropZone: elem,
                acceptFileTypes: self.options.accept,
                maxFileSize: self.options.maxFileSize,
                minFileSize: 10, // 10 Bytes
                limitConcurrentUploads: self.options.concurrent,
		messages: self.options.messages,
		add: function(e, data) {
		    var that = this;
		    data.process().done(function() {
			return $(that).fileupload('process', data);
                    }).always(function() {
			if ( data.files.error ) {
                            var msg = data.files[0].error;
                            elem.find('.vup-alert span').append('<p>'+self._fileName(data)+': '+msg);
                            //elem.find('.vup-alert').css('visibility','visible');
			    elem.find('.vup-alert').slideDown();
			    elem.find('.vup-alert').on( 'click.vup', function() {
				elem.find('.vup-alert').slideUp(function() {
				    elem.find('.vup-alert span').empty();
				    elem.find('.vup-alert').unbind( 'click.vup' );
				});
			    });
			}
			else {
			    elem.find('.vup-instructions').css( 'visibility', 'hidden' );
			    self._vpin_progress += 1;

			    var progress = self._calculateProgress(data);
                            var filename = self._fileName(data);
			    
                            // A count of the number of rows (current file uploads)
                            var index = elem.find(".vup-files tr").length;
			    
			    // create a cancel button for this upload
			    var cancelButton = $('<a href="#" class="vup-cancel-file">&times;</a>');
			    cancelButton.data( 'file', index );
			    cancelButton.click( function() {
				self._cancelUpload($(this).data( 'file' ));
				cancelButton.remove();
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
                            xhr.send(JSON.stringify({uuid: uuid, file:{Path:file.name}}));
                            var submit_url = xhr.getResponseHeader("Location");
                            var sessionID = submit_url.split('/').pop();

			    $(row).find(".vup-filename-column").text(filename);
                            $(row).find(".vup-file-progress-column").html(self._createProgressBar(progress));
                            $(row).find(".vup-cancel-column").append(cancelButton);
                            $(row).attr("sessionID", sessionID);
                            $(row).attr("offset", 0 );
			    
                            // Add the new file upload row to our list (table) of file uploads
                            $(row).appendTo(elem.find(".vup-files"));
			    
			    // Assign this row to this upload's context
                            data.context = row;
			    
                            // Add this upload data to our files container
                            data.finished = false;
			    self._vpfiles.push( data );

			    data.submit();
			}
		    });
		},
		done: function(e, data) {
                    self._vpin_progress -= 1;
                    data.context.find(".vup-file-progress-column .bar").html( self.options.done_message );
                    data.context.find(".vup-file-progress-column .bar").addClass( 'vp-file-done' );
                },
		progress: function(e, data) {
                    var progress;
                    data.context.removeData("retries");
                    progress = self._calculateProgress(data);
                    data.context.find(".vup-file-progress-column").html(self._createProgressBar(progress));
                    $(data.context).attr("offset", data.loaded);
                },
		progressall: function (e, data) {
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
                    offset = $(context).attr("offset");

                    files.url += '/' + sessionID;

                    // Set uploadedBytes on the context to ensure that if this upload was
                    // resumed, it will continue from where it left off.
                    $(context).attr("uploadedBytes", files.uploadedBytes);
 
                    // Set the required headers for the nginx upload module
                    e.setRequestHeader("Offset", offset);
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
                        row.find(".vup-file-progress-column .bar").addClass( 'vp-file-done' );
                        return;
                    }

                    // Grab its current retry count
                    retryCount = row.data("retries") || 1;
 
                    // Get our maxRetries and retryTimeout settings
                    maxRetries = $(this).data("blueimpFileupload").options.maxRetries + 1;
                    retryTimeout = $(this).data("blueimpFileupload").options.retryTimeout;
                    
                    // If we can still attempt a retry
                    if (retryCount < maxRetries) {
                        window.setTimeout(function() {
                            // Set the row's progress bar section to display that we are trying again
                            row.find(".vup-file-progress-column").html("<label>Retry #" + retryCount + "</label>");
 
                            // Increment the retry count and set it back on the row
                            row.data("retries", retryCount += 1);
                            
                            // Reassign the uploadedBytes, then submit to start the upload again.
                            data.uploadedBytes = parseInt(row.attr("uploadedBytes"), 10);
                            data.data = null;
                            $(data).submit();
                        }, retryCount * retryTimeout);
                        
                    } else {
                        // We've met our retry limit. Indicate that this upload has failed.
                        row.find(".vup-file-progress-column").html("<label>Upload failed</label>");
                        self._vpin_progress -= 1;
                    }
                }
	    });
	},

	_destroy: function() {
            elem.find('input[type=file]').fileupload( 'destroy' );
	}
    });
})(jQuery);

