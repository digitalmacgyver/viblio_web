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

    function tag( f, newname ) {
	viblio.api( '/services/faces/contact_for_name', { contact_name: newname } ).then( function( data ) {
	    if ( data.contact ) {
		// Unidentifed to identified
		viblio.mpEvent( 'face_tag_to_new' );
		
		// If we are adding a contact to this media file that does
		// not have a pitcure_uri, change the contact's picture_uri
		// to this instance of the user's picture.
		var tag_data = {
		    uuid: f.data.uuid,
		    cid:  data.contact.uuid };
		if ( ! data.contact.picture_uri ) 
		    tag_data.new_uri = f.data.uri

		viblio.api( '/services/faces/tag', tag_data ).then( function() {
		    faces.remove( f );
		    app.trigger( 'unnamed:tagged', f );
		    if ( faces().length == 0 ) {
			is_visible( false );
			app.trigger( 'unnamed:visibility', false );
		    }
		});
	    }
	    else {
		viblio.mpEvent( 'face_tag_to_identified' );
		viblio.api( '/services/faces/tag', {
		    uuid: f.data.uuid,
		    new_uri: f.data.uri,
		    contact_name: newname } ).then( function() {
			faces.remove( f );
			app.trigger( 'unnamed:tagged', f );
			if ( faces().length == 0 ) {
			    is_visible( false );
			    app.trigger( 'unnamed:visibility', false );
			}
		    });
	    }
	});
    }

    function addFace( face ) {
	var f = new Face( face, {
	    show_name: true,
	    clickable: true,
	    click: name_face
	} );
	faces.push( f );
    }

    var DOING_NAME = false;
    function name_face( person, event ) {
	if ( DOING_NAME ) return;
	DOING_NAME = true;
	$(view).find('.pp-faces-need-names span').on( 'hidden.XEDIT', function( e, reason ) {
	    if ( arguments.length == 2 ) {
		DOING_NAME = false;
		$(view).find('.pp-faces-need-names span').unbind( 'hidden.XEDIT' );
		$(view).find('.pp-faces-need-names span').editable('destroy');
		$(view).find('.pp-faces-need-names span').html('These faces need names!');
		$(view).find('.pp-faces-need-names span').removeClass( 'editable-unsaved' );
		$(person.view).removeClass( 'selected' );
	    }
	});

	$(person.view).addClass( 'selected' );

	$(view).find('.pp-faces-need-names span').editable({
	    mode: 'inline',
	    type: 'typeahead',
	    value: '',
	    display: false,
	    source: '/services/faces/all_contacts',
            sourceCache: false,
            sourceError: 'Sorry, we encountered an error.',
            sourceOptions: {
                data: { editable: 1 }
            },
            typeahead: {
                minLength: 2,
                highlighter: function( item ) {
                    var src, provider;
                    $.ajax({
                        url: '/services/faces/avatar_for_name',
                        data: { contact_name: item.text },
                        async: false,
                        success: function( data ) {
                            src = data.url;
                            provider = data.provider;
                        }
                    });
                    return '<img style="width: 30px; height: 30px; margin-right: 6px;" src="' + src + '"/><strong>' + item.text + '</strong><p class="contactSource"><span>Source: </span>' + provider + '</p>';
                }
            },
            validate: function( value ) {
                var v = $.trim(value);
                if ( v == '' ) {
                    return 'Please input a name.';
                }
                else {
                    return { newValue: v };
                }
            },
	    success: function( res, newvalue ) {
		tag( person, newvalue );
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
