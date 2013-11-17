/* File uploader compatible with Brewtus.  Using Blueimp jQuery Fileupload library,
   with api to deal with Brewtus protocol.  Supports multiple, parallel uploads and
   even drag and drop!
*/
define(['lib/viblio','lib/config','lib/customDialogs'], function(viblio,config,customDialogs) {
    var calculateProgress, cancelAllUploads, cancelUpload, createProgressBar, 
    fileName, files, maxChunkSize, startAllUploads, startUpload, uploadedFilePath, view;

    /* FOR INITIAL TEAM DEBUG, REMOVE FOR PRODUCTION!!!
       Add some controls to the screen allowing for over riding protocol and
       server to communicate with brewtus.
    */
    var protocol = ko.observable( location.protocol );
    var server   = ko.observable( config.uploader() );
    var localhost = ko.observable( location.hostname );

    var port = ko.computed( function() {
	if ( protocol() == 'https:' )
	    return 443;
	else
	    return 80;
    }, this );

    //var CREATE_ENDPT = ko.computed( function() {
//	return protocol() + '//' + server() + ':' + port() + '/files';
  //  }, this );
    var CREATE_ENDPT = ko.observable( '/files' );

    // When overrides change, notify the widget
    CREATE_ENDPT.subscribe( function( value ) {
	$("#fileupload").fileupload( 'option', 'url', value );
    });

    /* END OF TESTING STUFF */

    var overall_bitrate = ko.observable('0');
    var overall_time = ko.observable('00:00:00:00');
    var overall_percent = ko.observable('0%');
    var overall_size = ko.observable('0 / 0');
 
    // A container to hold all of the upload data objects.
    var files = [];
    var in_progress = 0;

    /*
     * A simple method to calculate the progress for an individual file upload.
     */
    calculateProgress = function(data) {
	var value;
	value = parseInt(data.loaded / data.total * 100, 10) || 0;
	return value + "%";
    };
 
    /*
     * Get the name of the file from the upload data.
     */
    fileName = function(data) {
	return data.files[0].name;
    };
 
    /*
     * Returns the path to the uploaded file on the server. 
     */
    uploadedFilePath = function(data) {
	var response;
	response = JSON.parse(data.result);
	if (response.files) {
	    return response.files[0][".path"];
	} else {
	    return response[".path"];
	}
    };
 
    /*
     * Cancels the upload for a file found at 'index' in the 'files' container.
     */
    cancelUpload = function(index) {
	if (files[index]) {
	    $(files[index].context).data('canceled', true);
	    if ( files[index].jqXHR ) {
		files[index].jqXHR.abort();

		// Cancel the upload on the server side
		var sessionID = $(files[index].context).attr('sessionID');
		var endpoint = CREATE_ENDPT() + '/' + sessionID;
		var xhr = new XMLHttpRequest();
		xhr.open("DELETE", endpoint, false ); // sync!
		xhr.send();
	    }
	    // $(files[index].context).remove();
	    in_progress -= 1;
	}
    };
 
    /*
     * Starts the upload for a file found at 'index' in the 'files' container.
     * If the file upload was interrupted, the 'uploadedBytes' attribute will be
     * reset to continue from where it left off.
     */
    startUpload = function(index) {
	$(view).find('.alert').css('visibility','hidden');
	$(view).find('.alert').empty();
	var context, data;
	data = files[index];
	context = data.context;
	if ( context.find(".progress").html() != 'Done!' ) {
	    data.uploadedBytes = parseInt($(context).attr("uploadedBytes"), 10);
	    data.data = null;
	    $(data).submit();
	}
    };
    
    cancelAllUploads = function() {
	$(files).each(function(index, file) {
	    cancelUpload(index);
	});
    };
 
    startAllUploads = function() {
	$(files).each(function(index, data) {
	    startUpload(index);
	});
    };
 
    createProgressBar = function(progress) {
	return '<span class="bar" style="width: ' + progress + '">' + progress + '</span>';
    };

    _formatFileSize = function (bytes) {
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

    _formatBitrate = function (bits) {
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

    _formatTime = function (seconds) {
        var date = new Date(seconds * 1000),
        days = Math.floor(seconds / 86400);
        days = days ? days + 'd ' : '';
        return days +
	    ('0' + date.getUTCHours()).slice(-2) + ':' +
	    ('0' + date.getUTCMinutes()).slice(-2) + ':' +
	    ('0' + date.getUTCSeconds()).slice(-2);
    };
    
    _formatPercentage = function (floatValue) {
        return (floatValue * 100).toFixed(2) + ' %';
    };

    return {
	overall_bitrate: overall_bitrate,
	overall_time: overall_time,
	overall_percent: overall_percent,
	overall_size: overall_size,
	displayName: 'Video File Upload',
	protocol: protocol,
	server: server,
	port: port,
	localhost: localhost,
	endpoint: CREATE_ENDPT,
	_renderExtendedProgress: function (data) {
            return this._formatBitrate(data.bitrate) + ' | ' +
		this._formatTime(
                    (data.total - data.loaded) * 8 / data.bitrate
		) + ' | ' +
		this._formatPercentage(
                    data.loaded / data.total
		) + ' | ' +
		this._formatFileSize(data.loaded) + ' / ' +
		this._formatFileSize(data.total);
	},

	canDeactivate: function() {
	    if ( in_progress > 0 )
		return customDialogs.showMessage('Any uploads in progress will be interrupted and lost.  Are you sure you want to leave this page?', 'Leave this page?', ['Yes', 'No']);
	    else
		return true;
	},

	compositionComplete: function( el ) {
	    var self = this;
	    view = el;
	    $('input[type=file]').bootstrapFileInput();
	    $("#fileupload").fileupload({
		url: CREATE_ENDPT(),
		type: 'PATCH',
		maxChunkSize: 1024 * 256,
		maxRetries: 15,
		retryTimeout: 1000,
		multipart: false,
		dataType: 'text',
		dropZone: $(document),
		acceptFileTypes: /(\.|\/)(3gp|avi|flv|m4v|mp4|mts|mov|mpeg|mpg|ogg|swf|mwv)$/i,
		maxFileSize: 10000000000, // 10 GB
		minFileSize: 10, // 10 Bytes
		limitConcurrentUploads: 4,
		messages: {
                    maxNumberOfFiles: 'Maximum number of files exceeded',
                    acceptFileTypes: 'Only video file types are uploadable',
                    maxFileSize: 'File is too large',
                    minFileSize: 'File is too small'
		},
		add: function(e, data) {
		    in_progress += 1;
		    var that = this;
		    // Collect some basic information about the file.
		    data.process().done(function() {
			return $(that).fileupload('process', data);
		    }).always(function() {
			if ( data.files.error ) {
			    var msg = data.files[0].error;
			    $(view).find('.alert').append('<p>'+fileName(data)+': '+msg);
			    $(view).find('.alert').css('visibility','visible');
			}
			else {
			    var progress = calculateProgress(data);
			    var filename = fileName(data);
 
			    // A count of the number of rows (current file uploads)
			    var index = $("#files tr").length;
 
			    // Create a start and stop button for this specific upload. The 'data-file' 
			    // attribute is used to pass the index of this upload to the cancelUpload
			    // and startUpload methods.
			    var cancelButton = $('<button class="btn btn-danger" type="button" data-file="' + index + '">Cancel upload</button>');
			    var startButton = $('<button class="btn btn-success" type="button" data-file="' + index + '">Start upload</button>');
			    var btnGroup = $('<div class="btn-group"></div>' );

			    $(btnGroup).append( startButton );
			    $(btnGroup).append( cancelButton );

			    // Cancel this specific upload when this button is clicked
			    cancelButton.click(function() {
				cancelUpload($(this).attr("data-file"));
			    });
 
			    // Start/Resume this specific upload when this button is clicked
			    startButton.click(function() {
				startUpload($(this).attr("data-file"));
			    });
 
			    // Create a new, empty row that will serve as the context for this file
			    // upload.
			    var row = $('<tr><td class="filename"></td><td class="progress"></td><td class="start-cancel"></td>');
 
			    /* qp 
			       Do the initial brewtus HEAD to "create" the file and get back the file id.
			    */
			    var uuid = viblio.getUser().uuid;
			    var file = data.files[0];
			    var endpoint = CREATE_ENDPT();
			    var xhr = new XMLHttpRequest();
			    xhr.open("POST", endpoint, false ); // sync!
			    xhr.setRequestHeader('Final-Length', file.size );
			    xhr.send(JSON.stringify({uuid: uuid, file:{Path:file.name}}));
			    var submit_url = xhr.getResponseHeader("Location");
			    sessionID = submit_url.split('/').pop();
 
			    // Set all the information for this upload on the context (row) for easier
			    // access
			    $(row).find(".filename").text(filename);
			    $(row).find(".progress").html(createProgressBar(progress));
			    $(row).find(".start-cancel").append(btnGroup);
			    $(row).attr("sessionID", sessionID);
			    $(row).attr("offset", 0 );

			    // Add the new file upload row to our list (table) of file uploads
			    $(row).appendTo("#files");
 
			    // Assign this row to this upload's context
			    data.context = row;
 
			    // Add this upload data to our files container
			    data.finished = false;
			    files.push(data);
			}
		    });
		},
 
		/* 
		 * Do something when the upload is done. This example replaces the progress
		 * bar we've been using with the path to the uploaded file on the server.
		 */
		done: function(e, data) {
		    in_progress -= 1;
		    // data.context.find(".progress").html(uploadedFilePath(data));
		    data.context.find(".progress").html('Done!');
		    data.context.find(".progress").addClass( 'done' );
		},
 
		/*
		 * This method is called whenever progress is reported back from nginx.
		 * Here, we're simply updating our progress bar to show the current progress.
		 * We're also clearing out any previous retry attempts once progress has
		 * been made.
		 */
		progress: function(e, data) {
		    var progress;
		    data.context.removeData("retries");
		    progress = calculateProgress(data);
		    data.context.find(".progress").html(createProgressBar(progress));
		    $(data.context).attr("offset", data.loaded);
		},
    
		/*
		 * This callback keeps track of the combined progress for all active uploads.
		 */
		progressall: function (e, data) {
		    overall_bitrate( _formatBitrate(data.bitrate) );
		    overall_time( _formatTime( (data.total - data.loaded) * 8 / data.bitrate ) );
		    overall_percent( _formatPercentage( data.loaded / data.total ) );
		    overall_size( _formatFileSize(data.loaded) + ' / ' + _formatFileSize(data.total) );
		},
 
 
		/*
		 * This method prepares the chunk that is about to be uploaded.
		 */
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
 
		/*
		 * This method will be called whenever an upload (or a single chunk) fails
		 * to complete. In this case, we're setting up an auto-resume feature to
		 * attempt the upload again (respecting our retry and timeout settings).
		 */
		fail: function(e, data) {
		    var maxRetries, retryCount, retryTimeout, row;
		    
		    // Get the context for this upload
		    row = $(data.context[0]);
		    
		    if ( row.data( 'canceled' ) ) {
			row.find( '.btn-group').empty();
			row.find(".progress").html('Canceled!');
			row.find(".progress .bar").css( 'width', '100%' );
			row.find(".progress").addClass( 'done' );
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
			    row.find(".progress").html("<label>Retry #" + retryCount + "</label>");
 
			    // Increment the retry count and set it back on the row
			    row.data("retries", retryCount += 1);
			    
			    // Reassign the uploadedBytes, then submit to start the upload again.
			    data.uploadedBytes = parseInt(row.attr("uploadedBytes"), 10);
			    data.data = null;
			    $(data).submit();
			}, retryCount * retryTimeout);
			
		    } else {
			// We've met our retry limit. Indicate that this upload has failed.
			row.find(".progress").html("<label>Upload failed</label>");
			in_progress -= 1;
		    }
		}
	    });

	    /*
	     * A convenient method for triggering the upload of multiple files from the 
	     * click of a button.
	     */
	    $("#start_upload").click(function() {
		startAllUploads();
	    });
 
	    /*
	     * A convenient method for triggering the cancellation of multiple files from 
	     * the click of a button.
	     */
	    $("#stop_uploads").click(function() {
		cancelAllUploads();
		in_progress = 0;
	    });
	    
	}
    };
});
