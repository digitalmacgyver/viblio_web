define(['durandal/events','lib/customDialogs'],function(Events,customDialogs) {
    var Person = function( data, options ) {
	this.data = data;

	options = $.extend( {
	    clickable: true,
	    click: null,

	    show_name: true,
	    show_tag1: false,

	    rightBadgeMode: 'hidden', // static, hover
	    rightBadgeImg: null,
	    rightBadgeClick: null,

	    leftBadgeMode: 'hidden',
	    leftBadgeImg: null,
	    leftBadgeClick: null
	}, options || {} );

	this.options = options;

	this.clickable = ko.observable( options.clickable );

	this.show_name = ko.observable( options.show_name );
	this.show_tag1 = ko.observable( options.show_tag1 );

	this.rightBadgeImg = ko.observable( options.rightBadgeImg );
	this.rightBadgeOn  = ko.observable( options.rightBadgeMode == 'static' );

	this.leftBadgeImg = ko.observable( options.leftBadgeImg );
	this.leftBadgeOn  = ko.observable( options.leftBadgeMode == 'static' );

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

    Person.prototype.tag1_changed = function( new_state ) {
	this.trigger( 'person:state_change', this, new_state );
    };

    Person.prototype.rightBadgeClick = function() {
	if ( this.options.rightBadgeClick )
	    this.options.rightBadgeClick( this );
    };
    
    Person.prototype.leftBadgeClick = function() {
	if ( this.options.leftBadgeClick )
	    this.options.leftBadgeClick( this );
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
    };

    Person.prototype.attached = function( view ) {
        this.view = view;
        this.trigger( 'person:attached', this );
    };

    Person.prototype.compositionComplete = function( view ) {
	var self = this;

        self.view = view;

	if ( self.options.leftBadgeImg ) {
	    if ( self.options.leftBadgeMode == 'hover' ) {
		$(self.view).find(".person-img").hover( 
		    function() {
			self.leftBadgeOn( true );
		    },
		    function() {
			self.leftBadgeOn( false );
		    });
	    }
	}

	if ( self.options.rightBadgeImg ) {
	    if ( self.options.rightBadgeMode == 'hover' ) {
		$(self.view).hover( 
		    function() {
			self.rightBadgeOn( true );
		    },
		    function() {
			self.rightBadgeOn( false );
		    });
	    }
	}

        self.trigger( 'person:composed', self );
    };
    
    return Person;
});
