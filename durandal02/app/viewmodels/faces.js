define(['durandal/app','durandal/system','plugins/router','lib/viblio','lib/customDialogs','viewmodels/face'], function(app,system,router,viblio,customDialogs,Face) {

    var known_faces = ko.observableArray([]);
    var unknown_faces = ko.observableArray([]);

    return {
	known_faces: known_faces,
	unknown_faces: unknown_faces,

	activate: function() {
	    var self = this;
	    return viblio.api( '/services/faces/all_contacts' ).then( function( data ) {
		known_faces.removeAll();
		unknown_faces.removeAll();
		data.contacts.forEach( function( contact ) {
		    if ( ! contact.url ) return;
		    var face = new Face( contact, { allow_changes: true, show_name: true } );
		    if ( contact.contact_name )
			known_faces.push( face );
		    else
			unknown_faces.push( face );
		    face.on( 'face:changed', function( f, data ) {
			if ( data.previous.name != data.current.name &&
			     ( ! data.previous.name || data.previous.name == 'unknown' ) ) {
			    // unknown to known
			    var rm = unknown_faces.remove( function( face ) {
				return face.data.uuid == data.uuid;
			    });
			    if ( data.cid ) {
				// We are saying this unknown person is the same as a previously known person
			    }
			    else {
				// Add to list of known faces and resort
				known_faces.push( rm[0] );
				known_faces.sort( function( f1, f2 ) {
				    return f1.name() == f2.name() ? 0 :
					(f1.name() < f2.name() ? -1 : 1 );
				});
			    }
			}
		    });
		});
	    });
	}
    };
}); 