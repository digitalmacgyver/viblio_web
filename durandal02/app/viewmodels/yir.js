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
	
	// An edit/done label to use on the GUI
	self.editLabel = ko.observable( 'Edit' );
    };

    // Toggle edit mode.  This will put all of media
    // files in the strip into/out of edit mode.  I'm thinking
    // this will be the way user's can delete their media files
    YIR.prototype.toggleEditMode = function() {
	var self = this;
	if ( self.editLabel() == 'Edit' )
	    self.editLabel( 'Done' );
	else
	    self.editLabel( 'Edit' );

	self.months().forEach( function( month ) {
	    month.media().forEach( function( mf ) {
		mf.toggleEditMode();
	    });
	});
    };

    YIR.prototype.fetch = function( year ) {
	var self = this;
	var args = { year: year };
	if ( self.cid ) args['cid'] = self.cid;
	viblio.api( '/services/yir/videos_for_year', args ).then( function( data ) {
	    self.months.removeAll();
	    data.media.forEach( function( month ) {
		//var mediafiles = new Array;
		var mediafiles = ko.observableArray([]);
		month.data.forEach( function( mf ) {
		    var m = new Mediafile( mf );
		    m.on( 'mediafile:play', function( m ) {
			router.navigate( '#/new_player?mid=' + m.media().uuid );
		    });
		    m.on( 'mediafile:delete', function( m ) {
			viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
			    self.months().forEach( function( month ) {
				month.media.remove( m );
			    });
			});
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
	self.editLabel( 'Edit' );
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
