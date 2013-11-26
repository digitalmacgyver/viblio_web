define(['durandal/events','lib/customDialogs'],function(Events,customDialogs) {
    var Person = function( data, options ) {
	this.data = data;

	options = $.extend( {
	    clickable: true,
	    click: null,
	    allow_changes: false,
	    show_name: true,
	    show_tag1: false }, options || {} );

	this.options = options;

	this.clickable = ko.observable( options.clickable );
	this.allow_changes = ko.observable( options.allow_changes );
	this.show_name = ko.observable( options.show_name );
	this.show_tag1 = ko.observable( options.show_tag1 );

	this.url = ko.observable( data.url );
	this.name = ko.observable( data.contact_name ? data.contact_name : 'unknown' );
	this.email = ko.observable( data.contact_email );

	this.appears_in = ko.observable( data.appears_in );
        this.hasStarPower = ko.computed( function() {
            if ( data.star_power ) {
                return true;
            } else {
                return false;
            }
        });
        if( this.hasStarPower() ) {
            this.star_power = ko.observable( data.star_power.slice(4) );
            this.star = ko.observable( data.star_power !== 'star0' );
            this.starColor = ko.computed( function() {
                if( data.star_power === 'star1' ) {
                    return 'css/images/gold-star.png';
                } else if ( data.star_power === 'star2' ) {
                    return 'css/images/silver-star.png';
                } else if ( data.star_power === 'star3' ) {
                    return 'css/images/bronze-star.png';
                }
            });
        };
	this.selected = ko.observable( false );
        
	Events.includeIn( this );
    };

    Person.prototype.changed = function( new_state ) {
	this.trigger( 'person:state_change', this, new_state );
    };
    
    Person.prototype.select = function(f, e) {
	var self = this;

	if ( self.clickable() ) {
	    if ( self.options.click ) {
		self.options.click( self );
	    }
	    else {
		self.trigger( 'person:selected', self );
	    }
	}

	if ( 0 ) {
            if ( $(e.target).parents('.person').hasClass('selected') ) {
		$(e.target).parents('.person').removeClass('selected');
            } else {
		$(e.target).parents('.person').siblings('.person').removeClass('selected');
		$(e.target).parents('.person').addClass('selected');
            }
	    if ( self.allow_changes() ) {
		var previous = {
		    url: self.url(),
		    email: self.email(),
		    name: self.name()
		};
		if ( self.name() && self.name() != 'unknown' ) {
		    // This is a known contact
		    customDialogs.showContactCard( self ).then( function( data ) {
			data.previous = previous;
			data.current  = {
			    url: self.url(),
			    email: self.email(),
			    name: self.name()
			};
			var viblio = require( 'lib/viblio' );
			viblio.mpEvent( 'manage_face' );
			self.trigger( 'person:changed', self, data );
		    });
		}
		else {
		    // This is an unidentified person
		    customDialogs.showMagicTag( self ).then( function( data ) {
			data.previous = previous;
			data.current  = {
			    url: self.url(),
			    email: self.email(),
			    name: self.name()
			};
			var viblio = require( 'lib/viblio' );
			viblio.mpEvent( 'tag_face' );
			self.trigger( 'person:changed', self, data );
		    });
		}
	    }
	}
    };

    Person.prototype.attached = function( view ) {
        this.view = view;
        this.trigger( 'person:attached', this );
    };

    Person.prototype.compositionComplete = function( view ) {
        this.view = view;
        this.trigger( 'person:composed', this );
    };
    
    return Person;
});
