/* 
   jlint - Lint our javascript code
*/
jshint = require( "jshint" );
glob   = require( "glob" );
options = require( "./package.json" );
util   = require( "util" );
fs     = require( "fs" );

var status = 0;

glob( options.jlintFiles, function( err, files ) {
    if ( err ) {
	console.log( err );
	process.exit(1);
    }
    files.forEach( function( file ) {
	var buf = fs.readFileSync( file, 'utf-8' );
	buf = buf.replace(/^\uFEFF/, '');  // remove Byte Order Mark
	var success = jshint.JSHINT(buf, options.jshintOptions );
	if ( success ) {
	    console.log( 'PASS for ' + file );
	}
	else {
	    console.log( 'FAIL for ' + file + ': errors: ' + jshint.JSHINT.errors.length.toString() );
	    jshint.JSHINT.errors.forEach(function(error) {
		if ( error ) {
		    console.log( '    ' + error.line + ': ' + error.reason );
		    console.log( '        ' + error.evidence );
		    status += 1;
		}
	    });
	}
    });
    process.exit( status );
});

