define(['plugins/router','lib/viblio','durandal/system'], function( router, viblio, system ) {

    var password = ko.observable();
    var displayname = ko.observable();
    var validated = ko.computed( function() {
	return password();
    });

    var email;
    var url;

    var labelShowHide = ko.observable( 'reveal' );

    var view;

    return {
	password: password,
	displayname: displayname,
	validated: validated,
	labelShowHide: labelShowHide,

	toggleShowHide: function() {
	    var t = $(view).find('input[name="password"]').attr( 'type' );
	    if ( t == 'password' ) {
		labelShowHide( 'obscure' );
		var t = $(view).find('input[name="password"]').attr( 'type', 'text' );
	    }
	    else {
		labelShowHide( 'reveal' );
		var t = $(view).find('input[name="password"]').attr( 'type', 'password' );
	    }
	},

	displayTerms: function() {
	},

	attached: function( el ) {
	    view = el;
	},

	canActivate: function( args ) {
	    // In the case when/if user has already registered and perhaps
	    // clicked on an old email link to this register page, lets bounce
	    // them to the url directly
	    if ( args && args.email && args.url ) {
		return system.defer( function( dfd ) {
		    viblio.api( '/services/na/valid_email', {email: args.email} ).then( function( json ) {
			if ( json.valid == 0 && json.why == 'email address taken' ) {
			    dfd.resolve({redirect: args.url});
			}
			else {
			    dfd.resolve( true );
			}
		    });
		}).promise();
	    }
	    else {
		return true;
	    }
	},

	activate: function( args ) {
	    if ( args ) {
		if ( args.email ) {
		    email = args.email;
		}
		if ( args.url ) {
		    url = args.url;
		}
	    }
	    return viblio.api( 
		'/services/na/find_share_info_for_pending',
		{ email: email } ).then( function( json ) {
		    if ( json.owner ) {
			displayname( json.owner.displayname );
		    }
		    else {
			displayname( 'Someone' );
		    }
		    // We also have the mediafile (json.media ) and so
		    // could display the poster, et. al. here.
		});
	},

	done: function() {
	    viblio.api( '/services/na/new_user', { email: email,
						   password: password(),
						   displayname: email } )
		.then( function() {
		    router.navigate( viblio.getLastAttempt() || url || '#/home' );
		});
	}
    };

});
