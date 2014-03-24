define(['plugins/router','durandal/app','durandal/system','viewmodels/header','viewmodels/landing_header','viewmodels/conditional_header','lib/viblio','lib/customDialogs','viewmodels/emailtest','lib/config','viewmodels/footer','facebook'], function (router, app, system, page_header, landing_header, conditional_header, viblio, customDialogs,emailtest,config,footer) {

    var header = ko.observable( );
    var location = ko.observable();
    var showFooter = ko.observable();
    
    router.on('router:route:activating').then(function(instance, instruction, router){
        location(instruction.config.title);
    });
    
    // scroll to top of page before new view has loaded
    router.on('router:navigation:attached').then(function(){
        $(document).scrollTop(0);
        // Sets up placeholder compatability for IE when needed
        $('input, textarea').placeholder();
    });

    router.on('router:navigation:complete').then(function(instance, instruction, router) {
        if (app.title) {
            document.title = instruction.config.title + " | " + app.title;
        } else {
            document.title = instruction.config.title;
        }
	header( instruction.config.header );      
	showFooter( instruction.config.showFooter );
    });

    // This is how you "guard" routes; ie make conditional decisions
    // on whether a route should proceed.  Combined with router.mapRoute()
    // (in main.js) with custom attributes (authenticated=true/false in
    // my case), you prevent some pages from being accessed unless the
    // user is logged in, and allow other pages to be publically accessible.
    // By remembering failed attempts, you can implement passthru authentication
    // as well.
    //
    router.guardRoute = function( instance, instruction ) {
	// Log it to analytics
	viblio.mpPage( instruction.config.title, '/' + instruction.config.route ); 
	if ( instruction.config.authenticated ) {
	    // If the route is marked authenticated, then do a server
	    // round trip to make sure we have a session.  If we do
	    // not, then redirect to login.  Otherwise continue to
	    // route endpoint.
	    return system.defer( function( dfd ) {
		$.getJSON( '/services/user/me' ).then( function( res ) {
		    if ( res && res.error ) {
			// Remember the failed attempt so we can return there
			// after a successful login.
			if ( instruction.config.route != 'login' )
			    viblio.setLastAttempt( instruction.config.route, instruction.queryString );
			dfd.resolve('login');
		    }
		    else {
			// Its ok (authenticated and user is logged in)
			if ( instruction.config.route != 'login' )
			    viblio.setLastAttempt( null );
			viblio.setUser( res.user );
			dfd.resolve({});
		    }
		}, function() {
		    viblio.notify( 'Server communication failure!', 'error' );
		    dfd.resolve(false);
		});
	    }).promise();
	}
        else {
	    // Not authenticated, so go!
	    if ( instruction.config.route != 'login' && instruction.config.route != 'register' )
		viblio.setLastAttempt( null );

	    if ( instruction.config.route == '' && 
		 ( viblio.getUser() && viblio.getUser().uuid ) ) {
		return('home');
	    }
	    if ( instruction.config.route == '' ||
		 instruction.config.route == 'landing' ) {
		// Redirect to signup.
		setTimeout( function() {
		    window.location = '/signup/';
		}, 1);
		return( false );
	    }
            return({});
        }
    };

    // Main logout point is here, because this module is about
    // the only one guarenteed to have been executed before the
    // one that might be calling logout.
    //
    function logout() {
	viblio.scheduleLogout();
	router.navigate( 'loggedOut' );
    }
    // Most will call this logout() function by triggering an event.
    //
    app.on( 'system:logout', function() {
	logout();
    });

    function buildRouterMap() {
        router.map([
            { route: '',                   moduleId: 'landing',            title: 'Viblio Landing Page',
	      showFooter: true, nav: false,   authenticated: false,  header: landing_header },

            { route: 'landing',            moduleId: 'landing',            title: 'Viblio Landing Page',
	      showFooter: true, nav: false,   authenticated: false,  header: landing_header },

            { route: 'home',               moduleId: 'hp',               title: 'VIDEOS',
	      showFooter: true, nav: true,    authenticated: true,   header: page_header },

            { route: 'oops',               moduleId: 'oops',               title: 'Oops',
	      showFooter: true, nav: false,    authenticated: false,   header: page_header },

            { route: 'videosof',           moduleId: 'videosof',           title: 'Videos Starring',
	      showFooter: true, nav: false,    authenticated: true,   header: page_header },

            { route: 'login',              moduleId: 'login',              title: 'Log in to your Viblio account',
	      showFooter: true, nav: false,   authenticated: false,  header: landing_header },

            { route: 'signup',              moduleId: 'signup',              title: 'Sign up for a Viblio account',
	      showFooter: true, nav: false,   authenticated: false,  header: landing_header },

            { route: 'confirmed',          moduleId: 'confirmed',          title: 'Account Confirmation',
	      showFooter: true, nav: false,   authenticated: false,  header: landing_header },

            { route: 'settings',           moduleId: 'settings',           title: 'User Settings',
	      showFooter: true, nav: false,   authenticated: true,   header: page_header },

            { route: 'upload',             moduleId: 'nginx',              title: 'UPLOAD',
	      showFooter: true, nav: false,    authenticated: true,   header: page_header },
          
            { route: 'albums',             moduleId: 'albums',             title: 'ALBUMS',
	      showFooter: true, nav: false,   authenticated: true,   header: page_header },
          
            { route: 'viewAlbum',          moduleId: 'viewAlbum',          title: 'Album View',
	      showFooter: true, nav: false,   authenticated: true,   header: page_header },
	    
            { route: 'videos',             moduleId: 'your-videos',          title: 'VIDEOS',
	      showFooter: true, nav: false,   authenticated: true,   header: page_header },
	    
            { route: 'people',             moduleId: 'people',             title: 'PEOPLE',
	      showFooter: true, nav: true,    authenticated: true,   header: page_header },
	    
            { route: 'raw',                moduleId: 'raw',                title: 'Raw Upload',
	      showFooter: true, nav: false,    authenticated: true,   header: page_header },
	    
            { route: 'emailtest',          moduleId: 'emailtest',          title: 'Email Test',
	      showFooter: true, nav: false,    authenticated: true,   header: page_header },
	    
            { route: 'new_player',             moduleId: 'pp',     title: 'Video Player',
	      showFooter: false, nav: false,   authenticated: true,   header: page_header },

            { route: 'forgotPassword',     moduleId: 'forgotPassword',     title: 'Forgot your Password?',
	      showFooter: true, nav: false,   authenticated: false,  header: landing_header },

            { route: 'web_player',         moduleId: 'pp',         title: 'Video Player',
	      showFooter: false, nav: false,   authenticated: false,   header: conditional_header },
          
            { route: 'loggedOut',           moduleId: 'loggedOut',         title: 'Log out successful',
	      showFooter: true, nav: false,   authenticated: true,   header: landing_header },

            { route: 'register',           moduleId: 'register',           title: 'Registration',
	      showFooter: true, nav: false,   authenticated: false,   header: landing_header },
          
            { route: 'TOS',           moduleId: 'TOS',           title: 'Viblio Terms of Service',
	      showFooter: true, nav: false,   authenticated: false,   header: conditional_header },
          
            { route: 'getApp',           moduleId: 'getApp',     title: 'Download Viblio',
                showFooter: true, nav: false,   authenticated: false,   header: conditional_header },
            
            { route: 'iosApp',           moduleId: 'iosApp',     title: 'Download Viblio iOS App',
                showFooter: false, nav: false,   authenticated: false,   header: 'ios_header.html' },
            
            { route: 'faq',           moduleId: 'faq',     title: 'Viblio FAQ',
                showFooter: true, nav: false,   authenticated: false,   header: conditional_header }, 
          
            { route: 'map',        moduleId: 'map',     title: 'MAP',
	      showFooter: true, nav: true,   authenticated: true,   header: page_header },
          
            { route: 'tutorial',        moduleId: 'tutorial',     title: 'Tray App Tutorial',
	      showFooter: true, nav: false,   authenticated: false,   header: conditional_header },
          
            { route: 'help',        moduleId: 'help',     title: 'Viblio help',
	      showFooter: true, nav: false,   authenticated: false,   header: conditional_header },
          
            { route: 'whoWeAre',   moduleId: 'whoWeAre',     title: 'Who We Are',
	      showFooter: true, nav: false,   authenticated: false,   header: conditional_header }

        ]).buildNavigationModel();
    }

    return {
        router: router,
	header: header,
        footer: footer,
        showFooter: showFooter,

        search: function() {
            //It's really easy to show a message box.
            //You can add custom options too. Also, it returns a promise for the user's response.
            app.showMessage('Search not yet implemented...');
        },
        activate: function ( args ) {
	    /* Application Entry
	       Check with the main server if this user is logged in.  If not, take them to
	       login screen.  If they already have an open session, take them to the landing
	       page.
	    */
	    router.on('router:route:not-found', function( fragment ) {
		viblio._why = { error: 'Route not found: ' + fragment,
				reason: 'No such route installed' };
		router.navigate( 'oops' );
	    });

	    return system.defer( function( dfd ) {
		$.getJSON( '/services/user/me' ).then( function( res ) {
		    if ( res && ! res.error ) {
			viblio.setUser( res.user );
		    }
		    buildRouterMap();
		    router.activate().then( function() {
			dfd.resolve();
		    });
		});
	    }).promise();

	    return router.activate();
        }
    };
});
