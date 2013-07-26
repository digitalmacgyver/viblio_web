define(['durandal/plugins/router','durandal/app','durandal/system','lib/viblio','facebook','purl'], function (router, app, system, viblio) {
    
    // This is how you "guard" routes; ie make conditional decisions
    // on whether a route should proceed.  Combined with router.mapRoute()
    // (in main.js) with custom attributes (authenticated=true/false in
    // my case), you prevent some pages from being accessed unless the
    // user is logged in, and allow other pages to be publically accessible.
    // By remembering failed attempts, you can implement passthru authentication
    // as well.
    //
    router.guardRoute = function( routeInfo, params, instance ) {
        if ( routeInfo.hash == '#/login' || routeInfo.hash == '#/' )
            return({});

	if ( routeInfo.authenticated ) {
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
	    router.navigateTo( '#/login' );
	});
    }
    // Most will call this logout() function by triggering an event.
    //
    app.on( 'system:logout', function() {
	logout();
    });

    return {
        router: router,
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
		    if ( res && res.error ) {
			router.activate( 'login' ).then( function() {
			    dfd.resolve();
			});
		    }
		    else {
			viblio.setUser( res.user );
			router.activate( 'welcome' ).then( function() {
			    dfd.resolve();
			});
		    }
		});
	    }).promise();
        },
	viewAttached: function( view ) {
            // Wrap the main content page with a custom scrollbar
            $(view).find(".container-fluid").mCustomScrollbar({
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
