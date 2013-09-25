define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/viblio', 'viewmodels/mediafile', 'viewmodels/hscroll', 'viewmodels/yir', 'lib/customDialogs' ], function (router, app, system, viblio, Mediafile, HScroll, YIR, customDialogs) {

    var strips = ko.observableArray([]);
    var hits, yir;
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
            dfd.resolve( new YIR( contact_id ) );
        } ).promise();
    }

    return {
        displayName: 'Videos Starring',        
	contactPhoto: contactPhoto,
	contactName: contactName,
        strips: strips,
        activate: function (args) {
	    var self = this;
	    contact_id = args.uuid;
	    self.strips.removeAll();
            
	    return system.defer( function( dfd ) {
		viblio.api( '/services/faces/contact', { cid: contact_id }).then( function( data ) {
		    var contact = data.contact;
		    contactPhoto( contact.url );
		    contactName( contact.contact_name );
		    $.when( hh('Box Office Hits', contact.contact_name + '\'s most popular videos', 
			       { search_api: function() {
				   return( { api: '/services/faces/media_face_appears_in', args: { contact_uuid: contact_id } } );
			       }}), 
			    yy( contact_id )
			 ).then( function( h1, h2 ) {
			     self.hits = h1;
			     self.yir  = h2;
			     self.strips.push( h1 );
			     self.strips.push( h2 );
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
		self.strips()[0].ready( view, parent );
		customDialogs.hideLoading();
                console.log(self.hits.mediafiles().length);
	    });
	}
    };
});
