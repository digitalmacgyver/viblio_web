/*
  Simple script using node-compress to concat and minimize the
  vendor javascript.  THIS FILE MUST BE KEPT UP TO DATE WITH
  INDEX.HTML.
*/
var compressor = require('node-minify');
new compressor.minify({
    type: 'no-compress',
    fileIn: [
	"vendor/jquery-1.9.1.min.js",
	"vendor/jquery.ui.widget.js",
	"vendor/ICanHaz.min.js",
	"vendor/head.core.js",
	"vendor/jquery.kinetic.js",
	"vendor/fancybox/jquery.fancybox.js",
	"vendor/flowplayer/flowplayer-3.2.12.min.js",
	"vendor/flowplayer/plugins/flowplayer.ipad-3.2.12.min.js",
	"vendor/jquery.iframe-transport.js",
	"vendor/jquery.fileupload.js",
	"vendor/jquery.fileupload-process.js",
	"vendor/jquery.fileupload-validate.js",
    ],
    fileOut: 'vendor.all.js',
    callback: function(err, min){
	if ( err ) {
            console.log(err);
	    process.exit(1);
	}
	else {
	    new compressor.minify({
		type: 'uglifyjs',
		fileIn: 'vendor.all.js',
		fileOut: 'vendor.min.js',
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
