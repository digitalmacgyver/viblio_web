define(['plugins/router','durandal/app','durandal/system','viewmodels/header','viewmodels/landing_header','lib/viblio','lib/customDialogs','facebook','purl'], function (router, app, system, page_header, landing_header, viblio, customDialogs) {

    var header = ko.observable( );

    router.on('router:navigation:complete').then(function(instance, instruction, router) {
        if (app.title) {
            document.title = instruction.config.title + " | " + app.title;
        } else {
            document.title = instruction.config.title;
        }
	header( instruction.config.header );
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
			    viblio.setLastAttempt( instruction.config.route );
			dfd.resolve('#/login');
		    }
		    else {
			// Its ok (authenticated and user is logged in)
			if ( instruction.config.route != 'login' )
			    viblio.setLastAttempt( null );
			viblio.setUser( res.user );
			dfd.resolve({});
		    }
		});
	    }).promise();
	}
        else {
	    // Not authenticated, so go!
	    if ( instruction.config.route != 'login' )
		viblio.setLastAttempt( null );

	    if ( instruction.config.route == '' && 
		 ( viblio.getUser() && viblio.getUser().uuid ) ) {
		return('#/home');
	    }
            return({});
        }
    };

    // Main logout point is here, because this module is about
    // the only one guarenteed to have been executed before the
    // one that might be calling logout.
    //
    function logout() {
	viblio.api( '/services/na/logout' ).then( function() {
	    viblio.setUser( null );
	    router.navigate( '#/loggedOut' );
	});
    }
    // Most will call this logout() function by triggering an event.
    //
    app.on( 'system:logout', function() {
	logout();
    });

    function buildRouterMap() {
        router.map([
            { route: '',                   moduleId: 'landing',            title: 'Viblio Landing Page',            
	      nav: false,   authenticated: false,  header: landing_header },

            { route: 'landing',            moduleId: 'landing',            title: 'Viblio Landing Page',            
	      nav: false,   authenticated: false,  header: landing_header },

            { route: 'home',               moduleId: 'home',               title: 'HOME',                           
	      nav: true,    authenticated: true,   header: page_header },

            { route: 'login',              moduleId: 'login',              title: 'Log in to your Viblio account',  
	      nav: false,   authenticated: false,  header: landing_header },

            { route: 'settings',           moduleId: 'settings',           title: 'User Settings',                  
	      nav: false,   authenticated: true,   header: page_header },

            { route: 'upload',             moduleId: 'upload',             title: 'UPLOAD',                         
	      nav: true,    authenticated: true,   header: page_header },
	    
            { route: 'player',             moduleId: 'player',             title: 'Video Player',                   
	      nav: false,   authenticated: true,   header: page_header },

            { route: 'new_player',             moduleId: 'new_player',             title: 'Video Player',                   
	      nav: false,   authenticated: true,   header: page_header },

            { route: 'forgotPassword',     moduleId: 'forgotPassword',     title: 'Forgot your Password?',         
	      nav: false,   authenticated: false,  header: landing_header },

            { route: 'invite',             moduleId: 'invite',             title: 'Viblio Invite',                  
	      nav: false,   authenticated: false,  header: landing_header },

            { route: 'shareVidModal',      moduleId: 'shareVidModal',      title: 'Viblio Share Video',             
	      nav: false,   authenticated: true,   header: page_header },

            { route: 'settings',           moduleId: 'settings',           title: 'User Settings',                  
	      nav: false,   authenticated: true,   header: page_header },

            { route: 'incoming',           moduleId: 'incoming',           title: 'Incoming Message',               
	      nav: false,   authenticated: true,   header: page_header },
          
            { route: 'loggedOut',           moduleId: 'loggedOut',           title: 'Log out successful',               
	      nav: false,   authenticated: false,   header: landing_header }
        ]).buildNavigationModel();
    }

    return {
        router: router,
	header: header,
        search: function() {
            //It's really easy to show a message box.
            //You can add custom options too. Also, it returns a promise for the user's response.
            app.showMessage('Search not yet implemented...');
        },
        activate: function () {
	    /* Application Entry
	       Check with the main server if this user is logged in.  If not, take them to
	       login screen.  If they already have an open session, take them to the landing
	       page.
	    */
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
