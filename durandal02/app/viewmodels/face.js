define(['durandal/events','lib/customDialogs'],function(Events,customDialogs) {
    var Face = function( data, options ) {
	this.data = data;

	options = $.extend( {
	    allow_changes: false,
	    show_name: true }, options || {} );

	this.allow_changes = ko.observable( options.allow_changes );
	this.show_name = ko.observable( options.show_name );

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

    Face.prototype.select = function(f, e) {
	var self = this;
	self.trigger( 'face:selected', self );
        if ( $(e.target).parents('.face').hasClass('selected') ) {
            $(e.target).parents('.face').removeClass('selected');
        } else {
            $(e.target).parents('.face').siblings('.face').removeClass('selected');
            $(e.target).parents('.face').addClass('selected');
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
		    self.trigger( 'face:changed', self, data );
		});
	    }
	    else {
		// This is an unidentified face
		customDialogs.showMagicTag( self ).then( function( data ) {
		    data.previous = previous;
		    data.current  = {
			url: self.url(),
			email: self.email(),
			name: self.name()
		    };
		    self.trigger( 'face:changed', self, data );
		});
	    }
	}
    };

    Face.prototype.attached = function( view ) {
        this.view = view;
        this.trigger( 'face:attached', this );
    };

    Face.prototype.compositionComplete = function( view ) {
        this.view = view;
        this.trigger( 'face:composed', this );
    };
    
    return Face;
});
