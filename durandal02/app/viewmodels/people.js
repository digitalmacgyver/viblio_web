define(['durandal/app','durandal/system','plugins/router','lib/viblio','lib/customDialogs','viewmodels/person'], function(app,system,router,viblio,customDialogs,Face) {

    var known_faces   = ko.observableArray([]);
    var unknown_faces = ko.observableArray([]);
    var faces_for     = ko.observableArray([]);
    var faces_for_visible = ko.observable( false );

    var view;
    var pending_changes = 0;

    var clipboard = ko.observableArray([]);
    var selected  = ko.observable();
    var selected_name = ko.computed( function() {
	if ( selected() ) {
	    return selected().name();
	}
	else {
	    return '';
	}
    });

    // Needed to keep the value of the inline editable up to date
    // with the knockout valiable.
    selected_name.subscribe( function( v ) {
	$(view).find( '.inline-editable' ).editable( 'setValue', v );
    });

    selected.subscribe( function( v ) {
	if ( v != null ) {
	    console.log( 'new', v.name() );
	    unknown_faces().forEach( function( f ) {
		f.name( v.name() );
		f.show_tag1( false );
		f.show_name( false );
		f.show_tag2( true );
	    });
	}
	else {
	    unknown_faces().forEach( function( f ) {
		f.name( 'unknown' );
		f.show_tag1( false );
		f.show_tag2( false );
		f.show_name( true );
	    });
	}
    });

    function deselectAll() {
	var all = clipboard.removeAll();
	all.forEach( function( f ) {
	    $(f.view).removeClass( 'selected' );
	});
    }

    function setKeyFrame( af ) {
	selected().url( af.url() );
	viblio.api( '/services/faces/change_contact', { uuid: selected().data.uuid, new_uri: af.data.uri } );
    }

    function addto_faces_unknown( contact ) {
	var f = new Face( contact, { clickable: false, show_name: true } );
	unknown_faces.push( f );
	f.on( 'person:tag2_changed', function( v ) {
	    //
	    // UNKNOWN TO KNOWN!!!
	    //
	    unknown_faces.remove( f );
	    addto_faces_for( f.data );
	});
    }

    function addto_faces_for( contact ) {
	var alt_face = new Face( contact, { 
	    clickable: false,
	    rightBadgeIcon: 'icon-camera',
	    rightBadgeClick: setKeyFrame,
	    rightBadgeMode: 'hover',
	    show_name: false, 
	    show_tag1: true } );
	alt_face.on( 'person:tag1_changed', function( af, new_state ) {
	    af.data.tag_state = new_state;
	    if ( new_state == 'reject' )
		pending_changes += 1;
	    else
		pending_changes -= 1;
	});
	faces_for.push( alt_face );
    }

    function person_selected( f ) {
	if ( clipboard.indexOf( f ) != -1 ) {
	    // its selected, so deselect it
	    clipboard.remove( f );
	    $(f.view).removeClass( 'selected' );
	    faces_for_visible( false );
	    selected(null);
	}
	else {
	    // its not selected, so select it.
	    deselectAll();
	    clipboard.push( f );
	    $(f.view).addClass( 'selected' );
	    selected( f );
	    viblio.api( '/services/faces/photos_of', { cid: f.data.uuid } ).then( function( photos ) {
		faces_for.removeAll();
		photos.forEach( function( p ) {
		    var data = {
			url: p.url,
			uri: p.uri,
			alt_id: p.id,
			contact_name: f.name(),
			contact_email: f.email(),
			appears_in: f.appears_in(),
			tag_state: 'accept'
		    };
		    var alt_face = new Face( data, { 
			clickable: false,
			rightBadgeIcon: 'icon-camera',
			rightBadgeClick: setKeyFrame,
			rightBadgeMode: 'hover',
			show_name: false, 
			show_tag1: true } );
		    alt_face.on( 'person:tag1_changed', function( af, new_state ) {
			af.data.tag_state = new_state;
			if ( new_state == 'reject' )
			    pending_changes += 1;
			else
			    pending_changes -= 1;
		    });
		    faces_for.push( alt_face );
		});
		faces_for_visible( true );
		var pos = $(f.view).offset().left + Math.round( $(f.view).width() / 2 );
		var arrow = $(view).find(".arrow");
		pos -= Math.round( $(arrow).width() / 2 );
		$(arrow).css( 'left', pos+'px' );
	    });
	}
    }

    return {
	known_faces: known_faces,
	unknown_faces: unknown_faces,
	faces_for: faces_for,
	faces_for_visible: faces_for_visible,
	selected_name: selected_name,

	activate: function() {
	    var self = this;
	    return viblio.api( '/services/faces/all_contacts' ).then( function( data ) {
		known_faces.removeAll();
		unknown_faces.removeAll();
		data.contacts.forEach( function( contact ) {
		    if ( ! contact.url ) return;
		    var face;
		    if ( contact.contact_name ) {
			face = new Face( contact, { 
			    show_name: true,
			    clickable: true,
			    click: function( f ) {
				if ( pending_changes ) {
				    customDialogs.showMessage( 'You have made some changes that have not been confirmed.', 'Are you sure?', ['Yes', 'No'] ).then( function( res ) {
					if ( res == 'Yes' ) {
					    pending_changes = 0;
					    person_selected( f );
					}
				    });
				}
				else {
				    person_selected( f );
				}
			    }
			});
			known_faces.push( face );
		    }
		    else {
			addto_faces_unknown( contact );
		    }
		});
	    });
	},

	// Done editing a person
	done: function() {
	    var self = this;
	    deselectAll();
	    self.faces_for_visible( false );

	    if ( pending_changes ) {
		faces_for().forEach( function( f ) {
		    console.log( f.name(), f.data.alt_id, f.data.tag_state );
		});
	    }

	    selected(null);
	    pending_changes = 0;
	},

	attached: function( v ) {
	    this.view = v;
	    view = v;
	},

	detached: function() {
	    console.log( 'DETACHED' );
	    $(self.view).find( ".horizontal-scroller").smoothDivScroll("destroy");
	    clipboard.removeAll();
	},

	compositionComplete: function() {
	    var self = this;
	    $(self.view).find( ".horizontal-scroller").smoothDivScroll({
		scrollingHotSpotLeftClass: "mCSB_buttonLeft",
		scrollingHotSpotRightClass: "mCSB_buttonRight",
		hotSpotScrolling: true,
		visibleHotSpotBackgrounds: 'always',
		scrollerRightLimitReached: function() {
		    // Since we hacked the widget to remove flicker,
		    // we need to manually hide the right most arrow when
		    // we hit the end.
		    $(self.view).find( ".horizontal-scroller").smoothDivScroll("nomoredata");
		}
            });
	    $(self.view).find( ".horizontal-scroller").smoothDivScroll("recalculateScrollableArea");
	    $(self.view).find( ".horizontal-scroller").smoothDivScroll("redoHotSpots");

	    $(self.view).find( '.inline-editable' ).editable({
		mode: 'inline',
		type: 'text',
		success: function( res, newvalue ) {
		    selected().name( newvalue );
		    faces_for().forEach( function( af ) {
			af.name( newvalue );
		    });
		    viblio.api( '/services/faces/change_contact', { uuid: selected().data.uuid, contact_name: newvalue } );
		}
	    });
	}
    };
}); 