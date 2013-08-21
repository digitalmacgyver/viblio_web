define(['plugins/router','durandal/app','durandal/system','viewmodels/header','viewmodels/landing_header','lib/viblio','facebook','purl'], function (router, app, system, page_header, landing_header, viblio) {

    var header = ko.observable( landing_header );
    
    router.on('router:navigation:complete').then(function(instance, instruction, router) {
        if (app.title) {
            document.title = instruction.config.title + " | " + app.title;
        } else {
            document.title = instruction.config.title;
        }
	header( instruction.config.header );
        system.log("params from onNavigationComplete: " + instruction.config);
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
        
        if ( instruction.config.hash == '#/login' || instruction.config.hash == '#/' )
            return({});

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
			var p = $.url( window.location.href );
			viblio.setLastAttempt( p.attr( 'relative') );
			dfd.resolve('#/login');
		    }
		    else {
			// Its ok (authenticated and user is logged in)
			viblio.setLastAttempt( null );
			viblio.setUser( res.user );
			dfd.resolve({});
		    }
		});
	    }).promise();
	}
        else {
	    // Not authenticated, so go!
            viblio.setLastAttempt( null );
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
	    router.navigate( '#/login' );
	});
    }
    // Most will call this logout() function by triggering an event.
    //
    app.on( 'system:logout', function() {
	logout();
    });

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
           
           // Used to gain access to routeInfo
           router.on('router:route:activating').then(function(instance, instruction) {
                system.log("routeInfo: " + instruction.config);
            });
           
           
           router.map([
                { route: '',                   moduleId: 'home',               title: 'HOME',                      nav: false,   authenticated: true,   header: page_header },
                { route: 'landing',            moduleId: 'landing',            title: 'Viblio Landing Page',       nav: false,   authenticated: false,  header: landing_header },
                { route: 'home',               moduleId: 'home',               title: 'HOME',                      nav: true,    authenticated: true,   header: page_header },
                { route: 'login',              moduleId: 'login',              title: 'login',                     nav: false,   authenticated: false,  header: landing_header },
                { route: 'settings',           moduleId: 'settings',           title: 'User Settings',             nav: false,   authenticated: true,   header: page_header },
                { route: 'upload',             moduleId: 'upload',             title: 'UPLOAD',                    nav: true,    authenticated: true,   header: page_header },
                { route: 'player',             moduleId: 'player',             title: 'Video Player',              nav: false,   authenticated: true,   header: page_header},
                { route: 'forgotPassword',     moduleId: 'forgotPassword',     title: 'Forgot Password',           nav: false,   authenticated: false,  header: landing_header},
                { route: 'invite',             moduleId: 'invite',             title: 'Viblio Invite',             nav: false,   authenticated: false,  header: landing_header},
                { route: 'shareVidModal',      moduleId: 'shareVidModal',      title: 'Viblio Share Video',        nav: false,   authenticated: true,   header: page_header},
                { route: 'shareVidModal',      moduleId: 'settings',           title: 'User Settings',             nav: false,   authenticated: true,   header: page_header}
            ]).buildNavigationModel();
           
	    system.defer( function( dfd ) {
		$.getJSON( '/services/user/me' ).then( function( res ) {
		    if ( res && res.error ) {
			router.activate( 'landing' ).then( function() {
			    dfd.resolve();
			});
		    }
		    else {
			viblio.setUser( res.user );
			router.activate( 'home' ).then( function() {
			    dfd.resolve();
			});
		    }
		});
	    }).promise();
            
            return system.defer;
            //router.activate();
        },
        
        // Creates a margin on both sides of the page host to make up for the 30px created by the scrollbar.
        // Doing it on "bindingComplete" prevents any jerky animations.
        /*bindingComplete: function( view ) {
            $(view).find(".page-host").css({"margin-left":"10px", "margin-right":"10px"});
        },*/
        
	attached: function( view ) {
            // Wrap the main content page with a custom scrollbar
            $(view).find(".scrollBarContainer").mCustomScrollbar({
                contentTouchScroll: true,
                theme: 'dark-thick',
                mouseWheel: true,
                autoHideScrollbar: true,
                advanced: {
                    updateOnContentResize: true,
                    updateOnBrowserResize: true
                }
            });
        }
    };
});
