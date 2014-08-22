/*
  Simple script using node-compress to concat and minimize the
  vendor javascript.  THIS FILE MUST BE KEPT UP TO DATE WITH
  INDEX.HTML.

  smoothDivScroll DOES NOT WORK when included here, and I don't
  know why.  I've had nothing bu trouble with that darn plugin!
  So snoothDivScroll is included as-is in index-opt.html.
*/
var compressor = require('node-minify');
new compressor.minify({
    type: 'no-compress',
    fileIn: [
	'lib/jquery/jquery-1.9.1.js',
	'lib/jquery/jquery.easing.1.3.js',
	'lib/jquery/jquery-ui-1.10.3.custom.min.js',
	'lib/knockout/knockout-2.3.0.js',
	'lib/bootstrap/js/bootstrap.js',
	'lib/bootstrap/js/bootstrap-editable.js',
	'lib/bootstrap/js/moment.min.js',
	'lib/flowplayer/flowplayer-3.2.12.min.js',
	'lib/flowplayer/plugins/flowplayer.ipad-3.2.12.min.js',
	'lib/alertify/js/alertify.js',
	'lib/mapbox/mapbox.js',
	'lib/mapbox/ViblioMap.js',
	'lib/jquery-tokeninput/jquery.tokeninput.js',
	'lib/jqueryFileUpload/js/vendor/bootstrap.file-input.js',
	'lib/viblio/uploader/vendor/jquery.ui.widget.js',
	'lib/viblio/uploader/vendor/jquery.iframe-transport.js',
	'lib/viblio/uploader/vendor/jquery.fileupload.js',
	'lib/viblio/uploader/vendor/jquery.fileupload-process.js',
	'lib/viblio/uploader/vendor/jquery.fileupload-validate.js',
	'lib/viblio/uploader/viblio.uploader.js',
	'lib/zeroclipboard/ZeroClipboard.js',
	'lib/ICanHaz.min.js',
	'lib/jquery.ba-throttle-debounce.min.js',
        'lib/jquery.placeholder.js',
	'lib/jquery.autosize.min.js',
	'lib/jquery.cookie.js',
	'lib/jquery.ui.touch-punch.min.js',
	'lib/fastclick.js',
        'lib/fancybox-2.1.5/jquery.fancybox.js',
        'lib/fancybox-2.1.5/helpers/jquery.fancybox-buttons.js'
    ],
    fileOut: 'build/lib/vendor.all.js',
    callback: function(err, min){
	if ( err ) {
            console.log(err);
	    process.exit(1);
	}
	else {
	    new compressor.minify({
		type: 'uglifyjs',
		fileIn: 'build/lib/vendor.all.js',
		fileOut: 'build/lib/vendor.min.js',
		callback: function(err,min) {
		    if ( err ) {
			console.log( err );
			process.exit(1);
		    }
		}
	    });
	}
    }
});
