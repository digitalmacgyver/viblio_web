define(['plugins/router','lib/viblio'], function( router, viblio ) {

    var email = ko.observable();
    var password1 = ko.observable();
    var password2 = ko.observable();
    var displayname = ko.observable();
    var edittable_email = ko.observable(true);
    var accept = ko.observable(false);
    var terms = ko.observable();
    var validated = ko.computed( function() {
	return email() && password1() && password2() &&
	    ( password1() == password2() ) &&
	    displayname() && accept();
    });
    var url;

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
	    //viblio.api( '/services/na/terms' ).then( function( json ) {
	    //	terms( json.terms );
	    // });
	    terms( 'You gotta agress to everything we say.  Period.' );
	},

	done: function() {
	}
    };

});
