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
    var is_visible = ko.observable( false );
    var faces = ko.observableArray([]);
    var start = 0;
    var numFacesTagged = 0;

    var pager = {};
    function reset_pager() {
	pager = {
            next_page: 1,
            entries_per_page: 30,
            total_entries: -1 /* currently unknown */
        };
    }
    reset_pager();

    var searching = ko.observable( false );

    app.on( 'person:tag3_changed', function() {
	numFacesTagged += 1;
	if ( numFacesTagged >= faces().length ) {
	    is_visible( false );
	    app.trigger( 'unnamed:visibility', false );
	}
    });

    function addFace( face ) {
	var f = new Face( face, {
	    show_name: true,
	    clickable: true,
	    click: name_face
	} );
	faces.push( f );
    }

    function name_face( person ) {
	$(view).find('.pp-faces-need-names').on( 'init', function( e, editable ) {
	    //editable.show();
	    console.log( 'INIT' );
	});
	$(view).find('.pp-faces-need-names span').editable({
	    mode: 'inline',
	    type: 'text',
	    value: '',
	    success: function( res, newvalue ) {
		console.log( 'newval', newvalue );
		$(view).find('.pp-faces-need-names span').editable('destroy');
		$(view).find('.pp-faces-need-names span').html('These faces need names!');
	    }
	});
	setTimeout( function() {
	    $(view).find('.pp-faces-need-names span').editable( 'show' );
	}, 500 );
    }

    function search() {
	return system.defer( function( dfd ) {
	    if ( pager.next_page ) {
		searching( true );
		viblio.api( '/services/faces/unnamed', 
			    { page: pager.next_page, rows: pager.entries_per_page } )
		    .then( function( data ) {
			pager = data.pager; 
			data.faces.forEach( function( face ) {
			    addFace( face );
			});

			searching( false );
			dfd.resolve();
		    });
	    } else {
		dfd.resolve();
	    }
	}).promise().then( function() {
	    if ( faces().length ) {
		is_visible( true );
		app.trigger( 'unnamed:visibility', true );
	    }
	    else {
		is_visible( false );
		app.trigger( 'unnamed:visibility', false );
	    }
	});
    }

    return {
	is_visible: is_visible,
	faces: faces,
	searching: searching,

	nextThree: function() {
	    if ( start + 3 >= faces().length ) return;
	    start += 3;
	    $(view).find('.fx').animate({'margin-left': '-' + ( start * 96 ) + 'px'});
	},

	prevThree: function() {
	    if ( start == 0 ) return;
	    start -= 3;
	    if ( start < 0 )
		start = 0;
	    $(view).find('.fx').animate({'margin-left': '-' + ( start * 96 ) + 'px'});
	},

	manageAll: function() {
	    router.navigate( 'people' );
	},

	compositionComplete: function( _view ) {
	    view = _view; this.view = _view;
	    faces.removeAll();
	    start = 0;
	    $(view).find('.fx').animate({'margin-left': '0px'});
	    reset_pager();
	    search();
	    app.trigger( 'unnamed:composed', this );
	}
    };
});
