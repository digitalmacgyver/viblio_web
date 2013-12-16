define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/mediafile', 'viewmodels/hscroll', 'viewmodels/yir', 'lib/customDialogs', 'viewmodels/allVideos', ], function (router, app, system, viblio, Mediafile, HScroll, YIR, customDialogs, allVideos) {

    var strips = ko.observableArray([]);
    //var hits, yir;
    var contact_id;
    var contactPhoto = ko.observable();
    var contactName  = ko.observable();
    
    function hh(title, subtitle, options) {
        return system.defer( function( dfd ) {
            dfd.resolve( new HScroll(title, subtitle, options) );
        } ).promise();
    }

    function yy( contact_id ) {
        return system.defer( function( dfd ) {
            dfd.resolve( new YIR( contact_id, contactName() ) );
        } ).promise();
    }
    
    function av( contact_id ) {
        return system.defer( function( dfd ) {
            dfd.resolve( new allVideos( contact_id, contactName() ) );
        } ).promise();
    }
    
    return {
        showShareVidModal: function() {
	    app.showMessage( 'Need a custom dialog for sharing this page.' );
        },
        displayName: 'Videos Starring',        
	contactPhoto: contactPhoto,
	contactName: contactName,
        strips: strips,
        activate: function (args) {
	    var self = this;
	    contact_id = args.uuid;
	    self.strips.removeAll();
            viblio.mpEvent( 'videos_of_actor' );
	    return system.defer( function( dfd ) {
		viblio.api( '/services/faces/contact', { cid: contact_id }).then( function( data ) {
		    var contact = data.contact;
		    contactPhoto( contact.url );
		    contactName( contact.contact_name );
		    $.when( hh('Box Office Hits', contactName() + '\'s most popular videos', 
			       { search_api: function() {
				   return( { api: '/services/faces/media_face_appears_in', args: { contact_uuid: contact_id } } );
			       }}), 
			    yy( contact_id ),
                            av( contact_id )
			 ).then( function( h1, h2, h3 ) {
			     self.hits = h1;
			     self.yir  = h2;
			     self.strips.push( h1 );
			     //self.strips.push( h2 );
                             self.strips.push( h3 );
			     dfd.resolve();
			 });
		});
	    }).promise();
        },
	attached: function() {
	    return system.defer( function( dfd ) {
		customDialogs.showLoading();
		dfd.resolve();
	    }).promise();
	},
	compositionComplete: function( view, parent ) {
	    var self = this;
	    system.wait(1).then( function() {
		customDialogs.hideLoading();
	    });
	}
    };
});
