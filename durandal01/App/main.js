requirejs.config({
    shim: {
        'facebook' : {
            export: 'FB'
        }
    },
    paths: {
	'purl': '../Scripts/purl',
        'text': 'durandal/amd/text',
        'facebook': '//connect.facebook.net/en_US/all',
	'fancybox': '../Vendor/fancybox-2.1.5/jquery.fancybox'
    }
});

define(['durandal/app', 'durandal/viewLocator', 'durandal/system', 'durandal/plugins/router','lib/custom_bindings','lib/viblio'], function(app, viewLocator, system, router) {

    //>>excludeStart("build", true);
    system.debug(true);
    //>>excludeEnd("build");

    app.title = 'Viblio';
    app.start().then(function() {
        //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        //Look for partial views in a 'views' folder in the root.
        viewLocator.useConvention();

        //configure routing
        router.useConvention();

	// Viblio:  Use this more explicit form for
	// setting up routes, so we can add our own
	// "authenticated" attribute, which is then
	// available in the router.guardRoute() handler
	// to manage authenticated pages and passthru
	// authentication.
	//
        router.mapRoute({
            url: 'login',
            visible: false,
            moduleId: null, name: null,
            authenticated: false
        });

        router.mapRoute({
            url: 'home',
            visible: true,
            moduleId: null, name: null,
            authenticated: true
        });

        router.mapRoute({
            url: 'upload',
            visible: true,
            moduleId: null, name: null,
            authenticated: true
        });

        router.mapRoute({
            url: 'landing',
            visible: false,
            moduleId: null, name: null,
            authenticated: false
        });

        router.mapRoute({
            url: 'player',
            visible: false,
            moduleId: null, name: null,
            authenticated: true
        });
        
        router.mapRoute({
            url: 'login2',
            visible: false,
            moduleId: null, name: null,
            authenticated: false
        });
        
        router.mapRoute({
            url: 'forgotPassword',
            visible: false,
            moduleId: null, name: null,
            authenticated: false
        });
        
        router.mapRoute({
            url: 'invite',
            visible: false,
            moduleId: null, name: null,
            authenticated: false
        });

        app.adaptToDevice();

        //Show the app by setting the root view model for our application with a transition.
        app.setRoot('viewmodels/shell', 'entrance');
    });
});
