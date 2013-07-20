define(['durandal/app','lib/viblio','lib/dialogs','viewmodels/mediafile'],function(app,viblio,dialogs,Mediafile) {
    var media = ko.observableArray([]);
    var edit_state = ko.observable( 'Edit' );

    return {
	media: media,
	edit_state: edit_state,

	toggleEditMode: function() {
	    if ( edit_state() == 'Edit' ) {
		// Going out of edit
		viblio.debug( 'going into edit mode...' );
		media().forEach( function( m ) {
		    m.enterEditMode();
		});
		edit_state( 'Done' );
	    }
	    else {
		// Going into edit
		viblio.debug( 'leaving edit mode' );
		media().forEach( function( m ) {
		    m.exitEditMode();
		});
		edit_state( 'Edit' );
	    }
	},

	viewAttached: function( view ) {
	    return viblio.api( '/services/user/media', { from: 's3' } ).then( function( json ) {
		// media( json.media );
		media.removeAll();
		for( var i=0; i<json.media.length; i++ )
		    media.push( new Mediafile( json.media[i] ) );
	    });
	}
    };
});
