define(['durandal/events'],function(Events) {
    var Face = function( data ) {
	this.data = data;

	this.url = ko.observable( data.url );
	this.name = ko.observable( data.contact_name ? data.contact_name : 'unknown' );
	this.appsears_in = ko.observable( data.appears_in );
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
	var pos = Math.round( e.target.x + (e.target.width/2) );
	this.trigger( 'face:selected', this, pos );
        if ( $(e.target).parents('.face').hasClass('selected') ) {
            $(e.target).parents('.face').removeClass('selected');
        } else {
            $(e.target).parents('.face').siblings('.face').removeClass('selected');
            $(e.target).parents('.face').addClass('selected');
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
