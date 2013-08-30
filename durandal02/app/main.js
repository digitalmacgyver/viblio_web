requirejs.config({
    paths: {
        'text': '../lib/require/text',
        'durandal':'../lib/durandal/js',
        'plugins' : '../lib/durandal/js/plugins',
        'transitions' : '../lib/durandal/js/transitions',

	'facebook': '//connect.facebook.net/en_US/all',

	'purl': '../lib/purl',

	'fancybox': '../lib/fancybox-2.1.5/jquery.fancybox',

        'm-custom-scrollbar' : '../lib/m-custom-scrollbar/jquery.mCustomScrollbar.concat.min'
    },
    shim: {
        'facebook' : {
            export: 'FB'
        }
    }
});

define('jquery', function () { return jQuery; });
define('knockout', ko);

define(['viewmodels/header', 'viewmodels/landing_header', 'durandal/app', 'durandal/viewLocator', 'durandal/system', 'plugins/router','lib/custom_bindings','lib/viblio','m-custom-scrollbar'], function(page_header, landing_header, app, viewLocator, system, router) {

    //>>excludeStart("build", true);
    system.debug(true);
    //>>excludeEnd("build");

    app.title = 'Viblio';
    
    //specify which plugins to install and their configuration
    app.configurePlugins({
        router: true,
        dialog: true,
        widget: true
    });

    function rsize() {
        var h = $(window).height() - 40;
        $(".container-fluid").height( h );
    }
    $(document).ready(function() {
        $(window).bind( 'resize', rsize );
        setTimeout( function() {
            rsize();
        },1000);
    });

    app.start().then(function() {
        //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        //Look for partial views in a 'views' folder in the root.
        viewLocator.useConvention();

        //configure routing
        router.makeRelative({moduleId:'viewmodels'});

        //Show the app by setting the root view model for our application with a transition.
        app.setRoot('viewmodels/shell', 'entrance');
    });
});
