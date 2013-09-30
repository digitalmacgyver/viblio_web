define( function() {
    return {
	compositionComplete: function( view ) {
	    $('input[type=file]').bootstrapFileInput();
	    $(view).find( "#raw-fileupload").fileupload({
		url: '/raw',
		dataType: 'json',
		maxRetries: 3,
		retryTimeout: 1000,
		maxFileSize: 20000000000, // 20 GB
		minFileSize: 10, // 10 Bytes
		limitConcurrentUploads: 4,
		done: function (e, data) {
		    $.each(data.result.files, function (index, file) {
			$('<p/>').text(file.name).appendTo('#files');
		    });
		},
		progressall: function (e, data) {
		    var progress = parseInt(data.loaded / data.total * 100, 10);
		    $('#progress .bar').css(
			'width',
			progress + '%'
		    );
		}
	    });
	}
    };
});
