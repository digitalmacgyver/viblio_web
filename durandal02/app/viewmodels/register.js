define(['plugins/router','lib/viblio','durandal/system'], function( router, viblio, system ) {

    var email = ko.observable();
    var email_valid = ko.observable(false);
    var password1 = ko.observable();
    var password2 = ko.observable();
    var displayname = ko.observable();
    var edittable_email = ko.observable(true);
    var accept = ko.observable(false);
    var terms = ko.observable();
    var validated = ko.computed( function() {
	return email() && email_valid() && password1() && password2() &&
	    ( password1() == password2() ) &&
	    displayname() && accept();
    });
    var url;

    var displayname_msg = ko.observable( 'required' );
    displayname.subscribe( function(v) {
	if ( v && v != '' )
	    displayname_msg( 'good' );
	else
	    displayname_msg( 'required' );
    });

    var email_msg = ko.observable( 'required' );
    email.subscribe( function(v) {
	if ( v && v != '' ) {
	    viblio.api( '/services/na/valid_email', { email: v } ).then( function( json ) {
		if ( json.valid ) {
		    email_msg( 'good' );
		    email_valid( true );
		}
		else {
		    email_msg( json.why );
		    email_valid( false );
		}
	    });
	}
	else {
	    email_msg( 'required' );
	    email_valid( false );
	}
    });

    var password1_msg = ko.observable( 'required' );
    password1.subscribe( function(v) {
	if ( v && v != '' )
	    password1_msg( 'good' );
	else
	    password1_msg( 'required' );
    });

    var password2_msg = ko.observable( 'required' );
    password2.subscribe( function(v) {
	if ( v && v != '' && v == password1() )
	    password2_msg( 'good' );
	else if ( ! v || v == '' )
	    password2_msg( 'required' );
	else
	    password2_msg( 'does not match' );
    });

    return {
	displayName: 'Registration',
	email: email,
	password1: password1,
	password2: password2,
	displayname: displayname,
	edittable_email: edittable_email,
	accept: accept,
	terms: terms,
	validated: validated,
	displayname_msg: displayname_msg,
	email_msg: email_msg,
	email_valid: email_valid,
	password1_msg: password1_msg,
	password2_msg: password2_msg,

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
		    email( args.email );
		    edittable_email( false );
		}
		if ( args.url ) {
		    url = args.url;
		}
	    }
	    viblio.api( '/services/na/terms' ).then( function( json ) {
	    	terms( json.terms );
	    });
	},

	done: function() {
	    viblio.api( '/services/na/new_user', { email: email(),
						   password: password1(),
						   displayname: displayname() } )
		.then( function() {
		    router.navigate( viblio.getLastAttempt() || url || '#/home' );
		});
	}
    };

});
