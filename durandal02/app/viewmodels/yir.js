define( ['plugins/router','lib/viblio','viewmodels/mediafile'], function( router,viblio, Mediafile ) {

    var YIR = function() {
	var self = this;

	self.years  = ko.observableArray([]);
	self.months = ko.observableArray([]);
    };

    YIR.prototype.fetch = function( year ) {
	var self = this;
	viblio.api( '/services/yir/videos_for_year', { year: year } ).then( function( data ) {
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
	return viblio.api( '/services/yir/years' ).then( function( data ) {
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

    return YIR;

});
