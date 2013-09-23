define( ['plugins/router','lib/viblio','viewmodels/mediafile'], function( router,viblio, Mediafile ) {

    var YIR = function( cid ) {
	var self = this;

	self.years  = ko.observableArray([]);
	self.months = ko.observableArray([]);
        self.shouldBeVisible = ko.computed(function() {
            if(self.months().length >= 1) {
                return true;
            } else {
                return false;
            }
        });
	self.cid = cid;
    };

    YIR.prototype.fetch = function( year ) {
	var self = this;
	var args = { year: year };
	if ( self.cid ) args['cid'] = self.cid;
	viblio.api( '/services/yir/videos_for_year', args ).then( function( data ) {
	    self.months.removeAll();
	    data.media.forEach( function( month ) {
		var mediafiles = new Array;
		month.data.forEach( function( mf ) {
		    var m = new Mediafile( mf );
		    m.on( 'mediafile:play', function( m ) {
			router.navigate( '#/new_player?mid=' + m.media().uuid );
		    });
		    mediafiles.push( m );
		});
		self.months.push({month: month.month, media: mediafiles});
	    });
	});
    };

    YIR.prototype.yearSelected = function( self, year ) {
	self.years().forEach( function( y ) {
	    y.selected( false );
	});
	year.selected( true );
	self.fetch( year.label );
    };

    YIR.prototype.activate = function() {
	var self = this;
	var args = {};
	if ( self.cid ) args['cid'] = self.cid;
	return viblio.api( '/services/yir/years', args ).then( function( data ) {
	    var arr = [];
	    data.years.forEach( function( year ) {
		arr.push({ label: year, selected: ko.observable(false) });
	    });
	    self.years( arr );
	    // self.years.push({ label: '2012', selected: ko.observable(false) }); // TEST DATA
	    if ( data.years.length >= 1 ) {
		self.years()[0].selected( true );
		self.fetch( self.years()[0].label );
	    }
	});
    };
    
    // Animation callbacks
    this.showElement = function(elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn('slow') }
    this.hideElement = function(elem) { if (elem.nodeType === 1) $(elem).fadeOut(function() { $(elem).remove(); }) }

    return YIR;

});
