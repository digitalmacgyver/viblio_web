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
		    var face = new Face( contact );
		    if ( contact.contact_name ) {
			face.on( 'face:selected',  function( sel, pos ) {
			    customDialogs.showContactCard( sel ).then( function( data ) {
				// Make changes
			    });
			});
			known_faces.push( face );
		    }
		    else {
			face.on( 'face:selected',  function( sel, pos ) {
			    customDialogs.showMagicTag( sel ).then( function( data ) {
				if ( data.uuid && data.contact_name ) {
				    // Remove from list of unknown faces
				    var rm = unknown_faces.remove( function( face ) {
					return face.data.uuid == data.uuid;
				    });
				    if ( data.cid ) {
					// We are saying this unknown person is the same as a previously known person
				    }
				    else {
					// Add to list of known faces and resort
					known_faces.push( rm[0] );
					rm[0].off( 'face:selected' );
					known_faces.sort( function( f1, f2 ) {
					    return f1.name() == f2.name() ? 0 :
						(f1.name() < f2.name() ? -1 : 1 );
					});
				    }
				}
			    });
			});
			unknown_faces.push( face );
		    }
		});
	    });
	}
    };
}); 