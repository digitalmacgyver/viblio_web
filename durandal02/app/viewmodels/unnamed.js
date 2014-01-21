/*
  Shows a small window with (up to) three faces that have
  not yet been named, a button that will go to the next
  batch (of up to three), and another button that will 
  navigate to the faces management page.
*/
define([
    'plugins/router', 
    'durandal/system', 
    'durandal/app', 
    'lib/viblio', 
    'viewmodels/person', 
    'lib/customDialogs'], 
function (router, system, app, viblio, Face, dialogs) {
    var view;
    var visible = ko.observable( false );
    var faces = ko.observableArray([]);
    var allFaces = [];
    var start = 0;
    var numFacesTagged = 0;
    var pager = {
            next_page: 1,
            entries_per_page: 30,
            total_entries: -1 /* currently unknown */
        };
    var searching = ko.observable( false );

    app.on( 'person:tag3_changed', function() {
	numFacesTagged += 1;
	if ( numFacesTagged >= allFaces.length ) {
	    visible( false );
	    app.trigger( 'unnamed:visibility', false );
	}
    });

    function addFace( face ) {
	var f = new Face( face, {
	    show_name: false,
	    show_tag3: true,
	} );
	allFaces.push( f );
    }

    function search() {
	if ( pager.next_page ) {
	    searching( true );
	    $(view).find('.fx').animate({'margin-left':'-312px'}, function() {
		faces.removeAll();
		viblio.api( '/services/faces/unnamed', 
			    { page: pager.next_page, rows: pager.entries_per_page } )
		    .then( function( data ) {
			pager = data.pager;
			data.faces.forEach( function( face ) {
			    addFace( face );
			});

			var end = start + 3;
			if ( end > ( allFaces.length + 1 ) )
			    end = allFaces.length + 1;
			faces( allFaces.slice( start, end ) );

			$(view).find('.fx').animate({'margin-left':'0px'});
			if ( data.faces.length ) {
			    visible( true );
			    app.trigger( 'unnamed:visibility', true );
			}
			else {
			    visible( false );
			    app.trigger( 'unnamed:visibility', false );
			}
			searching( false );
		    });
	    });
	}
    }

    return {
	visible: visible,
	faces: faces,
	searching: searching,

	nextThree: function() {
	    if ( start + 3 >= allFaces.length ) return;
	    start += 3;
	    var end = start + 3;
	    if ( end > ( allFaces.length + 1 ) )
		end = allFaces.length + 1;
	    $(view).find('.fx').animate({'margin-left':'-312px'}, function() {
		faces( allFaces.slice( start, end ) );
		$(view).find('.fx').animate({'margin-left':'0px'});
	    });
	},

	prevThree: function() {
	    if ( start == 0 ) return;
	    start -= 3;
	    if ( start < 0 )
		start = 0;
	    var end = start + 3;
	    if ( end > ( allFaces.length + 1 ) )
		end = allFaces.length + 1;
	    $(view).find('.fx').animate({'margin-left':'312px'}, function() {
		faces( allFaces.slice( start, end ) );
		$(view).find('.fx').animate({'margin-left':'0px'});
	    });
	},

	manageAll: function() {
	    router.navigate( 'people' );
	},

	compositionComplete: function( _view ) {
	    view = _view;
	    search();
	    app.trigger( 'unnamed:composed', this );
	}
    };
});
