requirejs.config({
    shim: {
        'facebook' : {
            export: 'FB'
        }
    },
    paths: {
        'text': '../Scripts/text',
        'durandal': '../Scripts/durandal/js',
        'plugins': '../Scripts/durandal/js/plugins',
        'transitions': '../Scripts/durandal/js/transitions',
	'purl': '../Scripts/purl',
        'facebook': '//connect.facebook.net/en_US/all',
	'fancybox': '../Vendor/fancybox-2.1.5/jquery.fancybox'
    }
});

define('jquery', function () { return jQuery; });
define('knockout', ko);

define(['viewmodels/header', 'viewmodels/landing_header', 'durandal/app', 'durandal/viewLocator', 'durandal/system', 'plugins/router','lib/custom_bindings','lib/viblio'], function(page_header, landing_header, app, viewLocator, system, router) {

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
    
    app.start().then(function() {
        //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        //Look for partial views in a 'views' folder in the root.
        viewLocator.useConvention();

        //configure routing
        router.makeRelative({moduleId:'viewmodels'});

	// Viblio:  Use this more explicit form for
	// setting up routes, so we can add our own
	// "authenticated" attribute, which is then
	// available in the router.guardRoute() handler
	// to manage authenticated pages and passthru
	// authentication.
	//
        /*router.mapRoute({
            url: 'login',
            visible: false,
            moduleId: null, name: null,
            authenticated: false,
            header: landing_header
        });

        router.mapRoute({
            url: 'home',
            visible: true,
            moduleId: null, name: null,
            authenticated: true,
            header: page_header
        });

        router.mapRoute({
            url: 'settings',
            visible: false,
            moduleId: null, name: null,
            authenticated: true,
            header: page_header
        });

        router.mapRoute({
            url: 'upload',
            visible: true,
            moduleId: null, name: null,
            authenticated: true,
            header: page_header
        });

        router.mapRoute({
            url: 'landing',
            visible: false,
            moduleId: null, name: null,
            authenticated: false,
            header: landing_header
        });

        router.mapRoute({
            url: 'player',
            visible: false,
            moduleId: null, name: null,
            authenticated: true,
            header: page_header
        });
        
        router.mapRoute({
            url: 'forgotPassword',
            visible: false,
            moduleId: null, name: null,
            authenticated: false,
            header: landing_header
        });
        
        router.mapRoute({
            url: 'invite',
            visible: false,
            moduleId: null, name: null,
            authenticated: false,
            header: landing_header
        });
        
        router.mapRoute({
            url: 'shareVidModal',
            visible: false,
            moduleId: null, name: null,
            authenticated: true
        });
        
        */

        //Show the app by setting the root view model for our application with a transition.
        app.setRoot('viewmodels/shell', 'entrance');
    });
});
