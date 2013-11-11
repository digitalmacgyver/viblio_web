var express = require( 'express' );
var http = require( 'http' );
var formidable = require( 'formidable' );
var fs = require( 'fs' );
var request = require( 'request' );

// config
var kphyg = require( "konphyg" )( __dirname );
var config = kphyg( 'app' ); // app.json

var app = express();

app.configure('development', function( ){
    app.use(express.logger('dev'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function( ){
    app.use(express.logger('default'));
    app.use(express.errorHandler());
});

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');

    app.use(express.favicon(__dirname + '/public/favicon.ico', 
			    { maxAge: 2592000000 }));
    //app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.get( '/', function( req, res, next ) {
    res.render( 'index', {} );
});

app.get( '/domains', function( req, res, next ) {
    exec = require( 'child_process' ).exec;
    child = exec( '/usr/local/bin/upgrade.pl -db staging -listall_json', function( err, stdout ) {
	var staging = JSON.parse( stdout );
	child = exec( '/usr/local/bin/upgrade.pl -db staging -listall_json', function( err, stdout ) {
	    var prod = JSON.parse( stdout );
	    res.json({
		staging: staging,
		prod: prod
	    });
	});
    });
});

app.post( '/release', function( req, res, next ) {
    var form = new formidable.IncomingForm();
    form.parse( req, function( err, fields, files ) {
	console.log( 'db', fields.db );
	if ( files.upload.size ) {
	    fs.readFile( files.upload.path, function( err, data ) {
		fs.writeFile( '/tmp/' + files.upload.name, data, function( err ) {
		    if ( ! err ) {

			var cmd = "/usr/local/bin/upgrade.pl" +
			    " -f " + '/tmp/' + files.upload.name +
			    " -db " + fields.db + 
			    " -app " + fields.app;
			if ( fields.bump == 'on' ) {
			    cmd = cmd + " -bump";
			}
			else {
			    cmd = cmd + " -version " + fields.version;
			}
			if ( fields.downgrade == 'on' ) {
			    cmd = cmd + " -downgrade";
			}
			console.log( cmd );

			res.json({
			    error: 0,
			    message: 'success'
			});
		    }
		    else {
			res.json({
			    error: 1,
			    message: 'Failed to process uploaded file.'
			});
		    }
		    fs.unlinkSync( files.upload.path );
		    fs.unlinkSync( '/tmp/' + files.upload.name );
		});
	    });
	}
	else {
	    res.json({
		error: 1,
		message: 'No file uploaded.'
	    });
	}
    });
});

app.get( '/start_search', function( req, res, next ) {
    console.log( config.account, config.user, config.password );

    var rq = request.get( 'http://' + config.account + '.loggly.com/apiv2/search', {
	auth: {
	    user: config.user,
	    password: config.password
	},
	qs: {
	    q: 'syslog.host:"*" syslog.appName:"check-and-install-software"',
	    from: '-24h',
	    until: 'now',
	    size: 10
	}}, function( e, rs, body ) {
	    if ( ! e ) 
		res.send( body );
	    else
		res.json({
		    error: 1,
		    message: e.message });
	});
});

app.get( '/search', function( req, res, next ) {
    console.log( 'id:', req.param( 'id' ) );
    var rq = request.get( 'http://' + config.account + '.loggly.com/apiv2/events', {
	auth: {
	    user: config.user,
	    password: config.password
	},
	qs: {
	    rsid: req.param( 'id' )
	}}, function( e, rs, body ) {
	    if ( ! e ) 
		res.send( body );
	    else
		res.json({
		    error: 1,
		    message: e.message });
	});

});

http.createServer(app).listen(app.get('port'), function(){
  console.log("App server listening on port " + app.get('port'));
});
