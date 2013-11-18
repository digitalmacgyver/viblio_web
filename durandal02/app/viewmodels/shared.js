define( ['plugins/router','lib/viblio','viewmodels/mediafile', 'durandal/app', 'durandal/events'], function( router,viblio, Mediafile, app, events ) {

    var sections = ko.observableArray([]);
    var editLabel = ko.observable( 'Edit' );

    return {
	sections: sections,
	editLabel: editLabel,

	activate: function() {
	    return viblio.api( '/services/mediafile/all_shared' ).then( function( data ) {
		var shared = data.shared;
		sections.removeAll();
		shared.forEach( function( share ) {
		    var mediafiles = ko.observableArray([]);
		    share.media.forEach( function( mf ) {
			var m = new Mediafile( mf ); m.ro( true );
			m.on( 'mediafile:play', function( m ) {
                            router.navigate( 'web_player?mid=' + m.media().uuid );
			});
			m.on( 'mediafile:delete', function( m ) {
			    viblio.api( '/services/mediafile/delete_share', { mid: m.media().uuid } ).then( function( data ) {
				viblio.mpEvent( 'delete_share' );
				sections().forEach( function( section ) {
				    section.media.remove( m );
				});
			    });
			});
			mediafiles.push( m );
		    });
		    share.owner.avatar = "/services/na/avatar?uid=" + share.owner.uuid + "&y=36";
		    sections.push({ owner: share.owner, media: mediafiles });
		});
	    });
	},

	toggleEditMode: function() {
	    var self = this;
            if ( editLabel() == 'Edit' )
		editLabel( 'Done' );
            else
		editLabel( 'Edit' );
	    
            sections().forEach( function( section ) {
		section.media().forEach( function( mf ) {
                    mf.toggleEditMode();
		});
            });
	}

    };
});