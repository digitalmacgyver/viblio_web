define(["durandal/app",
	"durandal/system",
	"plugins/router",
	"lib/config",
	"lib/viblio",
	"lib/customDialogs"],
function(app,system,router,config,viblio,customDialogs) {
    var width = ko.observable();
    var height  = ko.observable();
    var poster  = ko.observable();
    var src  = ko.observable();
    var oniOS = ko.observable( head.browser.ios )
    var player, mf;

    function resize() {
	var width = $(window).width();
	var height = ( width * 9 ) / 16;
	var top;
	if ( height > $(window).height() ) {
	    height = $(window).height();
	    width  = (height * 16)/9;
	    top = 0;
	}
	else {
	    top = ($(window).height() - height) / 2;
	}
	$("#videojs").css( 'width', width + 'px' );
	$("#videojs").css( 'height', height + 'px' );
	$("#videojs").css( 'top', top + 'px' );
	$(".videocontent").height( $(window).height() );

	$("#m1").width( $(window).width() );
	$("#m1").height( $(window).height() );
    }
    
    function getiOSApp() {
        window.open( 'https://itunes.apple.com/us/app/viblio/id883377114?mt=8' );
    }

    return {
	width: width,
	height: height,
	poster: poster,
	src: src,
        oniOS: oniOS,
        getiOSApp: getiOSApp,
	canActivate: function( args ) {
	    if ( args && args.mid ) {
		return system.defer( function( dfd ) {
		    viblio.setLastAttempt( 'phone?mid=' + args.mid );
		    viblio.api( '/services/na/media_shared', args, function( error ) {
			customDialogs.showWebPlayerError( "We're Sorry", error.message, error );
			dfd.resolve(false);
		    } ).then( function( data ) {
			if ( data.auth_required ) {
			    dfd.resolve({redirect:'login'});
			}
			else {
			    mf = data.media;
			    width( head.screen.width );
			    height( head.screen.height );
			    poster( mf.views.poster.url );
			    //poster( config.site_server + '/s/ip/' + mf.views.poster.uri );
			    src( mf.views.main.url );
			    viblio.mpEvent( 'mobile_share_view' );
			    
			    dfd.resolve( true );
			}
		    } );
		}).promise();
	    }
	    else {
		customDialogs.showMessage( 'Navigating to this page requires an argument.', 'Navigation Error' );
		return false;
	    }
	},

	compositionComplete: function() {
	    var self = this;

            oniOS( head.browser.ios ? true : false );
            
	    player = $("#videojs");
	    player.on( 'ended', function() {
		$("#videojs").css( 'display', 'none' );
		$("#m1").width( $(window).width() );
		$("#m1").height( $(window).height() );
		$("#m1").css( 'display', 'block' );
	    });
	    resize();
	    document.getElementById('videojs').setAttribute('poster', mf.views.poster.url );
	    $(window).resize( function() {
		setTimeout( function() {
		    resize();
		},100 );
	    });
	},

	close: function() {
	    $("#m1").css( 'display', 'none' );
	    $("#videojs").css( 'display', 'inline-block' );
	}
    };
});
