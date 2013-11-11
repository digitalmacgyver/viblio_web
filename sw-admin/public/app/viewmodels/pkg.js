define(['plugins/dialog','viewmodels/loggly','knockout', 'jquery'], function(dialog, loggly, ko) {
    var staging = ko.observableArray();
    var prod    = ko.observableArray();

    var apps    = ko.observableArray([]);
    var app     = ko.observable();
    var newapp  = ko.observable();
    var version = ko.observable();
    var bump_ver    = ko.observable( false );
    var downgrade = ko.observable( false );
    var db      = ko.observable( 'staging' );
    var image   = ko.observable( false );

    var events  = ko.observableArray([]);

    var valid   = ko.computed( function() {
	console.log( 'app:', app(), 'newapp:', newapp(), 'downgrade:', downgrade(),
		     'bump:', bump_ver(), 'version:', version(), 'image:', image() );
	return ( app() || newapp() ) &&
	    ( (downgrade() && version()) || (bump_ver() && !version()) || version() ) &&
	    image();
    }, this );

    bump_ver.subscribe( function( v ) {
	if ( v && downgrade() ) 
	    downgrade( !v );
    });
    downgrade.subscribe( function( v ) {
	if ( v && bump_ver() )
	    bump_ver( !v );
    });

    return {
	staging: staging,
	prod: prod,

	apps: apps,
	app: app,
	newapp: newapp,
	version: version,
	bump_ver: bump_ver,
	downgrade: downgrade,
	db: db,
	image: image,
	valid: valid,

	events: events,

	activate: function() {
	    $.getJSON( '/domains' ).then( function( domains ) {
		console.log( domains );
		if ( domains.error ) {
		    dialog.showMessage( domains.staging + domains.prod, "Error" );
		}
		else {
		    staging( domains.staging );
		    prod( domains.prod );
		    domains.staging.forEach( function( d ) {
			apps.push( d.app );
		    });
		}
	    });
	},

	attached: function( view ) {
	    this.view = view;
	},

	compositionComplete: function() {
	    $(':file').change( function() {
		var file = this.files[0];
		image( file.size > 0 );
	    });
	},

	status_only: function() {
	    dialog.show( new loggly() );
	},

	release: function() {
	    var file = $(this.view).find(':file')[0];
	    if ( file.files.length == 0 ) {
		alert( 'No File' );
	    }
	    else {
		var data = new FormData( $(this.view).find( 'form' )[0] );
		$.ajax({
		    url: '/release',
		    type: 'POST',
		    data: data,
		    
		    cache: false,
		    contentType: false,
		    processData: false,

		    success: function( r ) {
			// alert( 'success' );
			// refetch domains and start grabbing status from loggly
			if ( r.error ) {
			    dialog.showMessage( r.message, "Release Error" );
			}
			else {
			    $.getJSON( '/domains' ).then( function( domains ) {
				console.log( domains );
				if ( domains.error ) {
				    dialog.showMessage( domains.staging + domains.prod, "Error" );
				}
				else {
				    staging( domains.staging );
				    prod( domains.prod );
				}
			    });
			    dialog.show( new loggly() );
			}
		    },
		    error: function( err ) {
			alert( err );
		    }
		});
	    }
	}
    };
});