define( ['plugins/router','lib/viblio','viewmodels/mediafile', 'durandal/app', 'durandal/events'], function( router,viblio, Mediafile, app, events ) {

    var YIR = function( cid, name ) {
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
        
        self.name = ko.observable(name);
        self.firstName = ko.computed(function() {
            if ( name ) {
                return name.slice( 0, name.indexOf(' ') );
            } else {
                return null;
            }
        });
        self.hits = ko.observable();
        self.hasCID = ko.computed(function() {
            if (self.cid) {
                return true;
            } else {
                return false;
            }
        });
	
	// An edit/done label to use on the GUI
	self.editLabel = ko.observable( 'Edit' );  
    };
    
    // Get the number of mediafiles so the YIR style can be decided on.
    // 3 or more mediafiles gets the normal view, while less than 3 gets 
    // the "Got more videos?" view.
    YIR.prototype.getHits = function() {
        var self = this;
	var args = {};
	if ( self.cid ) {
            viblio.api('/services/faces/contact_mediafile_count?cid=' + self.cid).then( function( data ) {
                console.log( "getHits data with cid:  " + JSON.stringify( data ) );
                self.hits(data.count);
            });
        } else {
            // can send a user uuid in args to get number of videos for specific user: {uid: uuid}
            viblio.api( '/services/mediafile/count', args ).then( function( data ) {
                console.log( "getHits data:  " + JSON.stringify(data) );
                self.hits(data.count);
            });
        }
    };
    
    YIR.prototype.goToUpload = function() {
        router.navigate( 'upload' );
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
			router.navigate( 'new_player?mid=' + m.media().uuid );
		    });
		    m.on( 'mediafile:delete', function( m ) {
			viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
			    viblio.mpEvent( 'delete_video' );
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
	viblio.mpEvent( 'yir' );
	self.fetch( year.label );
    };

    YIR.prototype.activate = function() {
	var self = this;
	var args = {};
        self.getHits();
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
    this.showElement = function(elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn('slow'); };
    this.hideElement = function(elem) { if (elem.nodeType === 1) $(elem).fadeOut(function() { $(elem).remove(); }); };

    return YIR;

});
