define(['durandal/app',
        'durandal/system',
        'plugins/router',
        'lib/viblio',
        'lib/customDialogs',
        'viewmodels/person',
        'viewmodels/help'], 
    function(app,system,router,viblio,customDialogs,Face,Help) {
    
    var knownHelp = new Help( 'help/knownHelp.html' );
    var unknownHelp = new Help( 'help/unknownHelp.html' );
    var manageHelp = new Help( 'help/manageHelp.html' );
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
    
    var thePager = ko.observable({
        next_page: 1,
        entries_per_page: 50,
        total_entries: -1 /* currently unknown */
    });
    
    var fetched = ko.observable( false );
    var activeMode = ko.observable( null );
    
    var taggedDoneVisible = ko.observable( false );

    // Needed to keep the value of the inline editable up to date
    // with the knockout valiable.
    selected_name.subscribe( function( v ) {
	$(view).find( '.inline-editable' ).editable( 'setValue', v );
    });
    
    // This controls the switching of unnamed faces into different tag modes
    selected.subscribe( function( v ) {
	if ( v != null ) {
            activeMode( "select" );
	    unknown_faces().forEach( function( f ) {
		f.name( v.name() );
		f.show_tag2( true );
	    });
	}
	else {
            activeMode( null );
            taggedDoneVisible( false );
	    unknown_faces().forEach( function( f ) {
		f.name( 'insert name' );
		f.show_tag3( true );
	    });
	}
    });

    function deselectAll() {
	var all = clipboard.removeAll();
	all.forEach( function( f ) {
	    $(f.view).removeClass( 'selected' );
	});
    }

    // Change the "key frame" for an identified contact
    //
    function setKeyFrame( af ) {
	selected().url( af.url() );
	viblio.mpEvent( 'face_change_keyframe' );
	viblio.api( '/services/faces/change_contact', { uuid: selected().data.uuid, contact_name: selected().data.contact_name, new_uri: af.data.uri } );
    }

    // Delete an unknown contact from the database.
    //
    function removeUnknown( f ) {
	// Delete this contact from the database.
	viblio.mpEvent( 'face_delete_unidentified_contact' );
	viblio.api( '/services/faces/delete_contact', { cid: f.data.uuid } ).then( function() {
            $( f.view ).fadeOut( "slow", function() {
                // Animation complete.
                unknown_faces.remove( f );
            });
	});
    }

    /*function removeKnown( f ) {
	customDialogs.showMessage( 'This will delete ' + f.name() + ' from your set of identified faces.  Are you sure you want to do that?', 'Please Confirm', ['Yes', 'No'] ).then( function( res ) {
	    if ( res == 'Yes' ) {
		viblio.mpEvent( 'face_delete_identified_contact' );
		viblio.api( '/services/faces/delete_contact', { cid: f.data.uuid } ).then( function() {
		    unknown_faces.remove( f );
		});
		known_faces.remove( f );
		$(view).find( ".horizontal-scroller").trigger( 'children-changed' );
		if ( faces_for_visible() && ( selected() == f ) ) {
		    faces_for_visible( false );
		}
		if ( selected() == f ) {
		    selected( null );
		}
	    }
	});
    }*/
    function removeKnown( f ) {
	customDialogs.showMessage( 'This will move ' + f.name() + ' from your set of identified faces to your unknown faces.  Are you sure you want to do that?', 'Please Confirm', ['Yes', 'No'] ).then( function( res ) {
	    if ( res == 'Yes' ) {
		viblio.mpEvent( 'face_delete_identified_contact' );
		viblio.api( '/services/faces/change_contact', { uuid: f.data.uuid, contact_name: null } ).then( function() {
                    f.name('insert name');
		    //unknown_faces.unshift( f );
                    addto_faces_unknown( f.data )
		});
                $( f.view ).fadeOut( "slow", function() {
                    // Animation complete.
                    known_faces.remove( f );
                    $(view).find( ".horizontal-scroller").trigger( 'children-changed' );
                });
		if ( faces_for_visible() && ( selected() == f ) ) {
		    faces_for_visible( false );
		}
		if ( selected() == f ) {
		    selected( null );
		}
	    }
	});
    }    
    
    function removeFromFacesOf( f ) {
        console.log( f, viblio.getLocalStorage( 'rejectFace.doNotShowAgain' ) );
        //var num_faces_for = faces_for().length;
        var ids = [];
        if( viblio.getLocalStorage( 'rejectFace.doNotShowAgain' ) == "true" ) {
            handleRemoval();
        } else {
            customDialogs.showModal( 'viewmodels/rejectFaceModal' ).then( function( res ) {
                if ( res == 'Yes' ) {
                    handleRemoval();
                }
            });
        }
        
        function handleRemoval() {
            // handle face in GUI
            ids.push( f.data.alt_id );
            f.data.contact_name = 'insert name';
            $( f.view ).fadeOut( "slow", function() {
                // Animation complete.
                faces_for.remove( f );
            });
            addto_faces_unknown( f.data );

            // handle face in DB
            viblio.mpEvent( 'face_remove_false_positives' );
            viblio.api( '/services/faces/remove_false_positives',{ ids: ids } ).then( function( data ) {
                console.log( data );
                if ( data.contact && data.contact.url && selected() ) {
                    selected().url( data.contact.url );
                }
                // if it was the last face, then remove the selected face from known faces, and close the faces for strip
                if ( faces_for().length <= 0 ) {
                    known_faces.remove( selected() );
                    faces_for_visible( false );
                }

                if ( data.newids ) {
                    data.newids.forEach( function( info ) {
                        unknown_faces().forEach( function( face ) {
                            if ( face.data.alt_id == info.id ) {
                                face.data.alt_id = info.c_id;
                                face.data.uuid   = info.c_uuid;
                            }
                        });
                    });
                }
            });
        }
    }

    // Add a face to the known faces panel, and do the required setup
    //
    function addto_faces_known( contact, order, scrollTo ) {
	var face = new Face( contact, { 
	    leftBadgeIcon: 'fa fa-times-circle-o',
	    leftBadgeClick: removeKnown,
	    leftBadgeMode: 'hover',
	    show_name: true,
	    clickable: true,
	    click: function( f ) {
		if ( pending_changes ) {
		    customDialogs.showMessage( 
			'You have made some changes that have not been confirmed (by clicking on the Done button).  Do you still want to leave edit mode and loose your changes?', 
			'Confirmation', ['Yes', 'No'] ).then( function( res ) {
			    if ( res == 'Yes' ) {
				pending_changes = 0;
				person_selected( f, null );
			    }
			});
		}
		else {
		    person_selected( f, null );
		}
	    }
	});

	// Notify hscroller that its managed children count changed (so it can redraw)
	face.on( 'person:composed', function() {
	    $(view).find( ".horizontal-scroller").trigger( 'children-changed' );
            if( scrollTo ) {
                $(view).find( ".horizontal-scroller").smoothDivScroll( "scrollToElement", "number", known_faces.indexOf( face ) );
            }
            
	});

	face.on( 'person:mouseover', function() {
	    $(face.view).addClass( 'selected' );
	});

	face.on( 'person:mouseleave', function() {
	    if ( face != selected() )
		$(face.view).removeClass( 'selected' );
	});

	if ( order ) 
	    known_faces.push( face );
	else
	    known_faces.unshift( face );

	return face;
    }

    function addto_faces_unknown( contact ) {
        if( activeMode() == "select" ) {
            contact.contact_name = selected_name();
        }
	var f = new Face( contact, { 
	    clickable: false, 
	    leftBadgeIcon: 'fa fa-times-circle-o',
	    leftBadgeClick: removeUnknown,
	    leftBadgeMode: 'hover',
	    show_name: false, 
	    show_tag3: activeMode() == "select" ? false : true,
            show_tag2: activeMode() == "select" ? true : false
	});
	unknown_faces.push( f );
	f.on( 'person:tag2_changed', function( v ) {
	    //
	    // UNKNOWN TO KNOWN!!!
            // 
            // When the thumbs up icon is clicked
	    //
	    
	    f.data.added = true;
	    //pending_changes += 1;

	    // Get all the faces for this unknown contact and add them to the faces_for panel
	    viblio.api( '/services/faces/photos_of', { cid: f.data.uuid } ).then( function( photos ) {
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
		    addto_faces_for( data );
		});

		// and establish the tag in the database
		viblio.mpEvent( 'face_tag', { type: 'to_identified' } );
		viblio.api( '/services/faces/tag', {
		    uuid: v.data.uuid,
		    cid: selected().data.uuid,
                    contact_name: selected().name()
                } ).then( function() {
                    $( f.view ).fadeOut( "slow", function() {
                        // Animation complete.
                        unknown_faces.remove( f );
                    });
		});
	    });
	});
	f.on( 'person:tag3_changed', function( v, name ) {
	    // 
	    // UNKNOWN NAMED.  Could be named as an exiting contact
	    // or as a new contact.
	    
	    // Does the name match any of the identified contacts?
	    var match = null;
	    known_faces().forEach( function( f ) {
		if ( f.name() == name ) {
		    match = f;
		}
	    });

	    if ( match )
		viblio.mpEvent( 'face_tag', { type: 'to_identified' } );
	    else
		viblio.mpEvent( 'face_tag', { type: 'to_new' } );

	    // establish the tag in the database
	    viblio.api( '/services/faces/tag', {
		uuid: v.data.uuid,
		cid: ( match ? match.data.uuid : null ),
		new_uri: null,
		contact_name: name 
            } ).then( function() {
                // move this face to the identified list
                $( f.view ).fadeOut( "slow", function() {
                    // Animation complete.
                    unknown_faces.remove( v );
                });
                if ( ! match ) {
                    var face = addto_faces_known( v.data, null, true );
                    // and slide down the faces_of panel so that edit mode
                    // turns into click-to-confirm
                    person_selected( face, null, v.data );
                }
                else {
                    person_selected( match, null, v.data );
                    // scroll to item in known list
                    $(view).find( ".horizontal-scroller").smoothDivScroll("scrollToElement", "number", known_faces.indexOf(match) );
                }
            });
	});
	return f;
    }

    function addto_faces_for( contact ) {
	var alt_face = new Face( contact, { 
	    clickable: false,
	    rightBadgeIcon: 'fa fa-camera',
	    rightBadgeClick: setKeyFrame,
	    rightBadgeMode: 'static',
	    show_name: false, 
	    show_tag1: true,
            highlight: contact.highlight } );
	alt_face.on( 'person:tag1_changed', function( af, new_state ) {
	    /*af.data.tag_state = new_state;
	    if ( new_state == 'reject' )
		pending_changes += 1;
	    else
		pending_changes -= 1;*/
            removeFromFacesOf( af );
	});
	faces_for.push( alt_face );
        
        // scroll to the newly added face
        alt_face.on( 'person:composed', function( p ) {
            if( p.data.highlight ) {
                console.log( p, $(p.view).offset().top );
                $('body').scrollTop( 0 );
                //viblio.goTo( p.view, -$(view).find('.identified-Wrap').height() );
            }
        });
	return alt_face;
    }

    function person_selected( f, append, faceToHighlight ) {
	if ( clipboard.indexOf( f ) != -1 ) {
	    // its selected, so deselect it
	    clipboard.remove( f );
	    $(f.view).removeClass( 'selected' );
            setMargin();
            // scroll to the top of the page
            $('body').scrollTop( 0 );
	    faces_for_visible( false );
	    selected(null);
	}
	else {
	    // its not selected, so select it.
            // this will ensure the tagged done button is hidden when a new fave is selected
            taggedDoneVisible( false );
            setMargin();
	    deselectAll();
	    clipboard.push( f );
	    viblio.api( '/services/faces/photos_of', { cid: f.data.uuid } ).then( function( photos ) {
		if ( ! append )
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
                    // highlight the new image in the faces for area
                    if( faceToHighlight != undefined ) {
                        //data.highlight = faceToHighlight.picture_uri ? (faceToHighlight.picture_uri == p.uri ? true : false) : (faceToHighlight.uri == p.uri ? true : false);
                        if( faceToHighlight.picture_uri ) {
                            data.highlight = faceToHighlight.picture_uri == p.uri ? true : false;
                        } else {
                            data.highlight = faceToHighlight.uri == p.uri ? true : false;
                        }
                    }
		    addto_faces_for( data );
		});
                // scroll to the top of the page
                $('body').scrollTop( 0 );
		faces_for_visible( true );
                // highlight the new face in the identified faces
                $(f.view).addClass( 'selected' );
		var pos = $(f.view).offset().left + Math.round( $(f.view).width() / 2 );
		var arrow = $(view).find(".arrow");
		pos -= Math.round( $(arrow).width() / 2 );
		$(arrow).css( 'left', pos+'px' );
                
                // trigger this last to prevent showing the tag2 style for unnamed faces before sliding faces_for into view
                selected( f );
	    });
	}
    }
    
    function selectMoreFaces() {
        // scroll to the top of the page
        $('body').scrollTop( 0 );
        faces_for_visible( false );
        taggedDoneVisible( true );
        setMargin();
    }
    
    function selectionDone() {
        taggedDoneVisible( false );
        selected( null );
        deselectAll();
        activeMode( null );
        setMargin();
    }
    
    function setMargin( e, el ) {
        if( !view || $(view).find('.identified-Wrap').height() == 0 ) {
            setTimeout( function(){
                setMargin()
            },100);
        } else {
            // set top-margin for unnamed
            if( $(window).width() >= 900 ) {
                console.log( 'setting to', $(view).find('.identified-Wrap').height() )
                $(view).find('.scrollable').css('margin-top', $(view).find('.identified-Wrap').height() + 'px');      
            } else {
                $(view).find('.scrollable').css('margin-top', '0');
            }    
        }
    }
    
    function handlePager( pager, newSearch, redraw ) {
        thePager( pager );
        $('.paginationContainer').pagination( 'updateItems', pager.total_entries );
        $('.paginationContainer').pagination( 'updateItemsOnPage', pager.entries_per_page );
        $('.paginationContainer').pagination( 'drawPage', Number(pager.current_page) );
        
        // hide the pager prev and next buttons when there is only 1 page of results
        if( thePager().last_page == 1 ) {
            $( view ).find( '.paginationContainer .prev, .paginationContainer .next' ).hide();
        }
    };
    
    function fetchFaces( a ) {
        var args = {};
        args.page = a && a.page ? a.page : 1;
        args.rows = thePager().entries_per_page;

        viblio.api( '/services/faces/contacts_present_in_videos', args ).then( function( data ) {
            handlePager( data.pager );
            // the initial fetch has already been done, so clear out the exisitng unknown faces
            if( fetched() ) {
                unknown_faces.removeAll();
            }
            data.faces.forEach( function( contact ) {
                if ( ! contact.url ) return;
                if ( contact.contact_name ) {
                    if( fetched() ) return;
                    addto_faces_known( contact, true );
                }
                else {
                    addto_faces_unknown( contact );
                }
            });
            fetched( true );
            $('body').scrollTop( 0 );
        });
    }

    return {
        knownHelp: knownHelp,
        unknownHelp: unknownHelp,
        manageHelp: manageHelp,
	known_faces: known_faces,
	unknown_faces: unknown_faces,
	faces_for: faces_for,
	faces_for_visible: faces_for_visible,
	selected_name: selected_name,
	fetched: ko.observable( false ),
        taggedDoneVisible: taggedDoneVisible,
        
        setMargin: setMargin,
        selectMoreFaces: selectMoreFaces,
        selectionDone: selectionDone,

	// Done editing a person
	/*done: function() {
	    var self = this;
	    deselectAll();
	    self.faces_for_visible( false );
	    var new_url;
	    var num_faces_for = faces_for().length;
	    if ( pending_changes ) {
		var ids = [];
		faces_for().forEach( function( f ) {
		    if ( f.data.tag_state == 'reject' ) {
			ids.push( f.data.alt_id );
			f.data.contact_name = 'insert name';
			addto_faces_unknown( f.data );
			num_faces_for -= 1;
		    }
		});

		viblio.mpEvent( 'face_remove_false_positives' );
		viblio.api( '/services/faces/remove_false_positives',
			    { ids: ids } ).then( function( data ) {
				if ( data.contact && data.contact.url && selected() ) {
				    selected().url( data.contact.url );
				}
				if ( num_faces_for <= 0 ) {
				    known_faces.remove( selected() );
				}

				if ( data.newids ) {
				    data.newids.forEach( function( info ) {
					unknown_faces().forEach( function( face ) {
					    if ( face.data.alt_id == info.id ) {
						face.data.alt_id = info.c_id;
						face.data.uuid   = info.c_uuid;
					    }
					});
				    });
				}

				selected(null);
				pending_changes = 0;
			    });
	    }
	    else {
		// I THINK WE SHOULD NOT HAVE THE FOLLOWING CODE, IN CASE THERE are
		// actual contacts that do not appear in any video.
		//if ( faces_for().length == 0 ) {
		//    known_faces.remove( selected() );
		//}
		selected(null);
	    }
	},*/
        
        done: function() {
	    var self = this;
	    deselectAll();
            // scroll to the top of the page
            $('body').scrollTop( 0 );
	    self.faces_for_visible( false );
            selected(null);
        },

	attached: function( v ) {
	    this.view = v;
	    view = v;
            
            fetched( false );
	},

	canDeactivate: function() {
	    if ( pending_changes ) {
		return customDialogs.showMessage( 
		    'You have made some changes that have not been confirmed (by clicking on the Done button).  Do you still want to leave edit mode and loose your changes?', 
		    'Confirmation', ['Yes', 'No'] );
	    }
	    else {
		return true;
	    }
	},

	detached: function() {
	    var self = this;

	    clipboard.removeAll();
	    selected( null );
	    pending_changes = 0;
	    faces_for_visible( false );

	    known_faces.removeAll();
	    unknown_faces.removeAll();
	    self.fetched( false );
            
            $(window).off('.people');
            $(view).find('.paginationContainer').pagination('destroy');
	},

	compositionComplete: function( _view ) {
	    var self = this;
            
            fetchFaces();
            
	    $(self.view).find( '.inline-editable' ).editable({
		mode: 'inline',
		type: 'typeahead',
		source: '/services/faces/all_contacts',
                sourceCache: false,
                sourceError: 'Sorry, we encountered an error.',
                sourceOptions: {
                    data: { editable: 1 }
                },
                typeahead: {
                    minLength: 2,
                    highlighter: function( item ) {
                        var src;
                        $.ajax({
                            url: '/services/faces/avatar_for_name',
                            data: { contact_name: item.text },
                            async: false,
                            success: function( data ) {
                                src = data.url;
                            }
                        });
                        return '<img style="width: 30px; height: 30px; margin-right: 3px;" src="' + src + '"/><strong>' + item.text + '</strong>';
                    }
                },
                validate: function( value ) {
                    var v = $.trim(value);
                    var regexp1=new RegExp('^[a-zA-Z0-9 .!?"-]+$');
                    
                    if ( v == '' ) {
                        return 'Please input a name.';
                    } else if( regexp1.test( value ) ) {
                        return { newValue: v };
                    } else {
                        return 'Alphanumeric symbols only.';
                    }
                },
                success: function( res, newvalue ) {
		    var same_as = null;
		    known_faces().forEach( function( f ) {
			if ( f.name() == newvalue ) {
			    same_as = f;
			}
		    });
		    if ( same_as ) {
			// merge of two identified faces
			known_faces.remove( selected() );
			// SEND THE VIBLIO EVENT
			viblio.mpEvent( 'face_tag', { type: 'merge' } );
			viblio.api( '/services/faces/tag', {
			    uuid: selected().data.uuid,
			    cid: same_as.data.uuid } ).then( function() {
				person_selected( same_as, true );
			    });
		    }
		    else {
			// just changing the name
			selected().name( newvalue );
			faces_for().forEach( function( af ) {
			    af.name( newvalue );
			});
			viblio.mpEvent( 'face_name_change' );
			viblio.api( '/services/faces/change_contact', { uuid: selected().data.uuid, contact_name: newvalue } );
		    }
		}
	    });
            
            // handle margin above unknown faces
            $(window).on('resize.people', setMargin);
            
            $(window).on( 'scroll.people', function() {
                //console.log( $('body').scrollTop() );
            });
            
            // set up pagination
            $('.paginationContainer').pagination({
                //items: self.thePager().total_entries,
                //itemsOnPage: Number(self.thePager().entries_per_page),
                displayedPages: 3,
                edges: 1,
                hrefTextPrefix: '',
                cssStyle: 'light-theme',
                selectOnClick: false,
                onPageClick: function(pageNumber, event){
                    if( event && event.type == 'click' ) {
                        event.preventDefault();
                        fetchFaces( {page: pageNumber} );
                    }
                }
            });
	}
    };
}); 