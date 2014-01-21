/*
  Shows a small window with (up to) three faces that have
  not yet been named, a button that will go to the next
  batch (of up to three), and another button that will 
  navigate to the faces management page.
*/
define([
    'plugins/router', 
    'durandal/system', 
    'lib/viblio', 
    'viewmodels/person', 
    'lib/customDialogs'], 
function (router, system, viblio, Face, dialogs) {
    var faces = ko.observableArray([]);
    var pager = {
            next_page: 1,
            entries_per_page: 3,
            total_entries: -1 /* currently unknown */
        };
    var searching = ko.observable( false );

    function addFace( face ) {
	var f = new Face( face, {
	    show_name: false,
	    show_tag3: true,
	} );
	faces.push( f );
    }

    function search() {
	if ( pager.next_page ) {
	    searching( true );
	    faces.removeAll();
	    viblio.api( '/services/faces/unnamed', 
			{ page: pager.next_page, rows: pager.entries_per_page } )
		.then( function( data ) {
		    pager = data.pager;
		    data.faces.forEach( function( face ) {
			addFace( face );
		    });
		    searching( false );
		});
	}
    }

    return {
	faces: faces,
	searching: searching,

	nextThree: function() {
	    search();
	},

	manageAll: function() {
	    router.navigate( 'people' );
	},

	compositionComplete: function( view ) {
	    search();
	}
    };
});
