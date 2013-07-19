requirejs.config({
    shim: {
        'facebook' : {
            export: 'FB'
        }
    },
    paths: {
        'text': 'durandal/amd/text',
        'facebook': '//connect.facebook.net/en_US/all'
    }
});

define(['durandal/app', 'durandal/viewLocator', 'durandal/system', 'durandal/plugins/router','lib/viblio'],
    function(app, viewLocator, system, router) {

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

            router.mapRoute({
                url: 'login',
                visible: false,
                moduleId: null, name: null,
                authenticated: false
            });

            router.mapRoute({
                url: 'welcome',
                visible: true,
                moduleId: null, name: null,
                authenticated: false
            });

            router.mapRoute({
                url: 'flickr',
                visible: true,
                moduleId: null, name: null,
                authenticated: true
            });

            app.adaptToDevice();

            //Show the app by setting the root view model for our application with a transition.
            app.setRoot('viewmodels/shell', 'entrance');
        });
    });