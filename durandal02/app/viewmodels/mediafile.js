/*
  The main mediafile view/model.  Represents a mediafile from the
  server.  Returns an instance factory.
*/
define(['durandal/app', 'durandal/events', 'lib/viblio', 'lib/customDialogs'],function(app, Events, viblio, dialogs) {

    // Temporary.  Used to create random numbers to use for
    // number of video views, ratings, etc.  For GUI development
    // before the backend features are available.
    //
    function randomFromInterval(from,to) {
        return Math.floor(Math.random()*(to-from+1)+from);
    }

    // Constructor takes a mediafile json object from the
    // server and wraps it up as an observable.  Typical
    // access from a model or view is:
    //   m.media().views.main.url
    //
    var Video = function( data, options ) {
	//data.title = data.filename;
	//data.description = 'no description',
        
        var self = this;
        
	data.eyes = data.view_count || 0;

	self.options = $.extend({
	    ro: false,
            shared_style: false, // if mf is shared with user show different style
            in_process_style: false,
	    show_share_badge: false,
            show_select_badge: false,
            selected: false,
	    share_action: 'modal', // 'modal' to popup showShareVidModal, 'trigger' to trigger mediafile:share, function as a callback
	    show_preview: true,    // show animated gif, if available, on hover.
            show_delete_mode: false,
            delete_title: 'delete',
            show_faces_tags: false,
            ownedByViewer: false,
            popup_player: false,
            clean_style: false
	}, options );
        
	self.media    = ko.observable( data );
	self.selected = ko.observable( self.options.selected );
	self.edittable = ko.observable( false );
	self.ro       = ko.observable( self.options.ro );  // If true, then cannot edit title
        self.in_process_style = ko.observable( self.options.in_process_style );
        self.shared_style = ko.observable( self.options.shared_style );
        self.gift_style = ko.computed( function() {
            if( data.is_viblio_created == 1 ) {
                return true;
            } else {
                return false;
            }
        });
        self.clean_style = ko.observable( self.options.clean_style );
        self.owner_avatar = "/services/na/avatar?uid=" + data.owner_uuid + "&y=40";
        self.owner_name = ko.computed( function(){
            if( data.owner ) {
                return data.owner.displayname;
            }
        });
        
        self.popup_player = ko.observable( self.options.popup_player );
	self.show_share_badge = ko.observable( self.options.show_share_badge );
        self.show_select_badge = ko.observable( self.options.show_select_badge );
        self.show_delete_mode = ko.observable( self.options.show_delete_mode );
        self.show_faces_tags = ko.observable( self.options.show_faces_tags );
        
        self.winWidth = ko.observable( $(window).width() );
        self.tags_editable = ko.observable( self.options.ownedByViewer );
        self.faces = ko.observableArray( data.views.face );
        self.facesToShow = ko.computed( function() {
            if( self.winWidth() > 1280 ) {
                if( self.faces().length > 4 ) {
                    return self.faces().slice( 0, 4 );
                } else {
                    return self.faces();
                }    
            } else {
                if( self.faces().length > 3 ) {
                    return self.faces().slice( 0, 3 );
                } else {
                    return self.faces();
                }    
            }          
        });
        self.facesLeft = ko.computed( function() {
            return self.faces().length - self.facesToShow().length; 
        });
        
        self.showFaces = ko.observable( false );
        
        self.showTags = ko.observable( false );
	self.tags = ko.observableArray( data.tags );

	self.title = ko.observable( data.title );
	self.description = ko.observable( data.description );

	self.image = ko.observable( self.options.in_process_style ? null : self.media().views.poster.url );

	Events.includeIn( self );

	// This will be triggered by a save on the liveEdit custom
	// binding.
	self.on( "mediaFile:TitleDescChanged", function( data ) {
            var regexp1=new RegExp('^[a-zA-Z0-9 .!?"-]+$');
            if( regexp1.test( self.title() ) ) {
                viblio.api( '/services/mediafile/set_title_description',
                            { mid: self.media().uuid,
                              title: self.title(),
                              description: self.description()
                            }).then( function() {
                                viblio.mpEvent( 'title_description_changed' );
                            });
            } else {
                return;
            }
	});
        
        self.tagLabels = ko.observableArray([{label: 'New Tag', selected: ko.observable(false)},{label: 'Animals', selected: ko.observable(false)},{label: 'At home', selected: ko.observable(false)},{label: 'Beach', selected: ko.observable(false)},
        {label: 'Children', selected: ko.observable(false)},{label: 'On the road', selected: ko.observable(false)},{label: 'Outdoors', selected: ko.observable(false)},{label: 'Parties', selected: ko.observable(false)},
        {label: 'Performances', selected: ko.observable(false)},{label: 'Pets', selected: ko.observable(false)},{label: 'Presentations', selected: ko.observable(false)}, {label: 'Sports - balls', selected: ko.observable(false)},
        {label: 'Sports - snow', selected: ko.observable(false)}, {label: 'Sports – water', selected: ko.observable(false)},{label: 'Vacation', selected: ko.observable(false)}]);
    
        self.selectedTag = ko.observable();
        self.newTagSelected = ko.computed( function() {
            if( self.selectedTag() == 'New Tag' ) {
                return true;
            } else {
                return false;
            }
        });
        
        self.newTag = ko.observable(null);

    };
    
    Video.prototype.toggleFaces = function() {
        var self = this;
        self.showFaces() ? self.showFaces( false ) : self.showFaces( true );
    };
    
    Video.prototype.toggleTags = function() {
        var self = this;
        //self.selectedTag( null );
        self.showTags() ? self.showTags( false ) : self.showTags( true );
        
        // recording date editable
        $(self.view).find(".recording-date").editable({
            mode: 'popup',
            type: 'date',
            unsavedclass: null,
            highlight: null,
            savenochange: true,
            format: 'yyyy-mm-dd',
            viewformat: 'MM yyyy',
            showbuttons: 'bottom',
            datepicker: {
                todayHighlight: true
            },
            success: function( res, v ) {
                // v is a Date in localtime, but what is displayed in the cal is UTC
                var date_utc = moment.utc(v);
                var dstring = date_utc.format( 'YYYY-MM-DD HH:mm:ss' );
                var showDate = date_utc.format( 'MMMM YYYY' );
                self.media().recording_date = dstring;
                viblio.api( '/services/mediafile/change_recording_date', { mid: self.media().uuid, date: dstring } ).then( function( tagsArray ) {
                    self.tags( tagsArray );
                });
                return null;
            }
        });
    };
    
    Video.prototype.tagSelected = function( parent, data ) {
        var self = parent;
        
        if( data.selected() ) {
            data.selected( false );
            self.selectedTag( null );
        } else {
            self.tagLabels().forEach( function( t ) {
                t.selected( false );
            });
            data.selected( true );
            
            if( data.label == 'New Tag' ) {
                self.selectedTag( data.label );
                $('.newTagInput').trigger('focus');
            } else {
                self.selectedTag( data.label );
                self.addTag();
            }            
        }   
    };
    
    Video.prototype.addTag = function( parent, event ) {
        var self = this;
        
        var args = {
            mid: self.media().uuid,
            tag: self.newTagSelected() ? self.newTag() : self.selectedTag()
        };
        
        if( args.tag ) {
            // check to see if video already has selectred tag
            var present = false;
            self.tags().forEach( function( t ) {
                if( t == args.tag ) {
                    present = true;
                }
            });
            
            if( present ) {
                // already exists, no dups
                return
            } else {
                // tag does not exist, so add it
                viblio.api(' /services/mediafile/add_tag', args).then( function() {
                    self.tags.push( args.tag );
                    self.tagLabels().forEach( function( t ) {
                        t.selected( false );
                    });
                    self.selectedTag( null );
                    self.newTag( null );
                    
                    // Used to close the dropdown
                    $("body").trigger("click");
                });
            }           
        }
    };
    
    Video.prototype.removeTag = function( $parent, $data ) {
        var self = this;
        
        var args = {
            mid: $parent.media().uuid,
            tag: $data
        };
        viblio.api('/services/mediafile/rm_tag', args).then( function() {
            $parent.tags.remove( $data );
        });
    };

    Video.prototype.highlight = function() {
	$(this.view).addClass( 'selected' );
    };

    Video.prototype.unhighlight = function() {
	$(this.view).removeClass( 'selected' );
    };

    // Toggle selected state to on and send an event.
    Video.prototype.select = function() {
	this.selected( true );
        this.trigger( 'mediafile:selected', this );
    };
    
    // Toggle selected state to off and send an event.
    Video.prototype.unselect = function() {
	this.selected( false );
        this.trigger( 'mediafile:unselected', this );
    };

    // User clicked on play(), send an event.
    Video.prototype.play = function() {
	this.trigger( 'mediafile:play', this );
    };

    // User clicked on delete(), send an event
    Video.prototype.mfdelete = function() {
	this.trigger( 'mediafile:delete', this );
    };

    Video.prototype.share = function() {
	if ( typeof this.options.share_action == 'function' )
	    this.options.share_action( this );
	else if ( this.options.share_action == 'modal' )
	    dialogs.showShareVidModal( this );
	else if ( this.options.share_action == 'trigger' )
	    this.trigger( 'mediafile:share', this );
    };
    
    Video.prototype.toggleEditMode = function() {
	this.edittable( this.edittable() ? false : true );
	if ( this.show_share_badge() )
	    $(this.view).find( '.media-share-badge' ).toggleClass( 'hideme' );
        $(this.view).find( '.dbtn' ).animate({padding: [ "toggle", "swing" ], width: [ "toggle", "swing" ]}, 300);
    };
    
    Video.prototype.mfOwnedByViewer = function( mf ) {
        var uuid;
        if( mf.owner_uuid ){
            uuid = mf.owner_uuid;
        } else if( mf.media().owner_uuid ){
            uuid = mf.media().owner_uuid;
        }
        
        if( uuid === viblio.user().uuid ){
            return true;
        } else {
            return false;
        } 
    };
    
    Video.prototype.turnOnSelectMode = function() {
	this.show_share_badge( false );
        this.show_select_badge( true );
    };
    
    Video.prototype.turnOffSelectMode = function() {
        if( this.mfOwnedByViewer(this) ){
            this.show_share_badge( true );
        }      
        this.show_select_badge( false );
    };

    // Send an event, so those above can manage screen
    // redraws, if needed.
    Video.prototype.attached = function( view ) {
	this.view = view;
	this.trigger( 'mediafile:attached', this );
    };

    Video.prototype.compositionComplete = function( view ) {
	var self = this;
	self.view = view;
	self.trigger( 'mediafile:composed', self );

	if ( self.options.show_preview ) {
	    if ( self.media().views.poster_animated && 
		 self.media().views.poster_animated.url ) {
		$(view).on( 'mouseover', function() {
		    self.image( self.media().views.poster_animated.url );
		});

		$(view).on( 'mouseleave', function() {
		    self.image( self.media().views.poster.url );
		});
	    }
	}
        
        if ( self.options.show_delete_mode ) {
            $( '.media-share-badge' ).addClass( 'hideme' );
            $( '.dbtn' ).show();
        }
        
        // Handle shared ownership section
        if ( self.options.shared_style ) {
            $(view).hover(
                function () {
                  $(view).find('.sharedOwnerWrap').stop(true, true).animate({ 'bottom': '54px' }, 'fast');
                }, 
                function () {
                  $(view).find('.sharedOwnerWrap').stop(true, true).animate({ 'bottom': '-60px' }, 'fast');
                }
            );
        }
        
        // Handle information section
        $(view).hover(
            function () {
              $(view).find('.clean').stop(true, true).animate({ 'bottom': '0' }, 'fast');
            }, 
            function () {
              $(view).find('.clean').stop(true, true).animate({ 'bottom': '-54px' }, 'fast');
            }
        );
        
        // this will trigger the number of faces to show to be correct when resizing window
        //$( window ).bind('resize', function(){ self.winWidth( $( window ).width() );} );
    };
    
    return Video;
});
