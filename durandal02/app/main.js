requirejs.config({
    paths: {
        'text': '../lib/require/text',
        'durandal':'../lib/durandal/js',
        'plugins' : '../lib/durandal/js/plugins',
        'transitions' : '../lib/durandal/js/transitions',

	'facebook': '//connect.facebook.net/en_US/all'
    },
    shim: {
        'facebook' : {
            export: 'FB'
        }
    }
});

requirejs.onError = function (err) {
    console.log(err);
    if (err.requireType === 'scripterror') {
        alert(err);
    } else {
        throw err;
    }
};

define('jquery', function () { return jQuery; });
define('knockout', ko);

define(['viewmodels/header', 'viewmodels/landing_header', 'durandal/app', 'durandal/viewLocator', 'durandal/system', 'plugins/router','plugins/dialog','lib/animatedDialogContext','lib/custom_bindings','lib/viblio'], function(page_header, landing_header, app, viewLocator, system, router, dialog, animatedDialogContext) {

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

    // Create a custom, animated dialog type
    dialog.addContext( 'animated', animatedDialogContext );

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
