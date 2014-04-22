define(['durandal/events','lib/customDialogs'],function(Events,customDialogs) {
    var Person = function( data, options ) {
	this.data = data;

	options = $.extend( {
	    clickable: true,
	    click: null,

	    show_name: true,
	    show_tag1: false,
	    show_tag2: false,
	    show_tag3: false,

	    rightBadgeMode: 'hidden', // static, hover
	    rightBadgeIcon: null,
	    rightBadgeClick: null,

	    leftBadgeMode: 'hidden',
	    leftBadgeIcon: null,
	    leftBadgeClick: null
	}, options || {} );

	this.options = options;

	this.clickable = ko.observable( options.clickable );

	this.show_name = ko.observable( options.show_name );
	this.show_tag1 = ko.observable( options.show_tag1 );
	this.show_tag2 = ko.observable( options.show_tag2 );
	this.show_tag3 = ko.observable( options.show_tag3 );

	this.rightBadgeIcon = ko.observable( options.rightBadgeIcon );
	this.rightBadgeOn  = ko.observable( options.rightBadgeMode == 'static' );

	this.leftBadgeIcon = ko.observable( options.leftBadgeIcon );
	this.leftBadgeOn  = ko.observable( options.leftBadgeMode == 'static' );

	this.url = ko.observable( data.url );
	this.name = ko.observable( data.contact_name ? data.contact_name : 'unknown' );
	this.email = ko.observable( data.contact_email );

	this.url.subscribe( function( v ) {
	    data.url = v;
	});

	this.name.subscribe( function( v ) {
	    data.contact_name = v;
	});

	this.email.subscribe( function( v ) {
	    data.contact_email = v;
	});

	this.show_name.subscribe( function( v ) {
	    if ( v ) {
		this.show_tag1( false );
		this.show_tag2( false );
		this.show_tag3( false );
	    }
	}, this);

	this.show_tag1.subscribe( function( v ) {
	    if ( v ) {
		this.show_name( false );
		this.show_tag2( false );
		this.show_tag3( false );
	    }
	}, this);

	this.show_tag2.subscribe( function( v ) {
	    if ( v ) {
		this.show_name( false );
		this.show_tag1( false );
		this.show_tag3( false );
	    }
	}, this);

	this.show_tag3.subscribe( function( v ) {
	    if ( v ) {
		this.show_name( false );
		this.show_tag2( false );
		this.show_tag1( false );
	    }
	}, this);

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

    Person.prototype.mouseover = function(d, e) {
	/*if ( head.mobile ) 
	    // With touch, mouseover (apparently) trumps click
	    this.select( d, e );
	else*/
	    this.trigger( 'person:mouseover', this );
    };

    Person.prototype.mouseleave = function(d, e) {
	this.trigger( 'person:mouseleave', this );
    };

    Person.prototype.tag1_changed = function( new_state ) {
	this.trigger( 'person:tag1_changed', this, new_state );
    };

    Person.prototype.tag2_changed = function( new_state ) {
	this.trigger( 'person:tag2_changed', this, new_state );
    };

    Person.prototype.tag3_changed = function( newname, oldname ) {
	this.trigger( 'person:tag3_changed', this, newname, oldname );
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
		self.options.click( self, e );
	    }
	    else {
		self.trigger( 'person:selected', self, e );
	    }
	}
	else {
	    return true;
	}
    };
    
    Person.prototype.updateName = function( data, e ) {
        e.stopPropagation();
        $( e.currentTarget ).siblings('.name').trigger('click');
    };

    Person.prototype.attached = function( view ) {
        this.view = view;
        this.trigger( 'person:attached', this );
    };

    Person.prototype.compositionComplete = function( view ) {
	var self = this;

        self.view = view;

	if ( self.options.leftBadgeIcon ) {
	    if ( self.options.leftBadgeMode == 'hover' ) {
		$(self.view).hover( 
		    function() {
			self.leftBadgeOn( true );
		    },
		    function() {
			self.leftBadgeOn( false );
		    });
	    }
	}

	if ( self.options.rightBadgeIcon ) {
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
