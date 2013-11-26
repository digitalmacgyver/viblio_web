define( ['plugins/router','lib/viblio','viewmodels/mediafile', 'durandal/app', 'durandal/events'], function( router,viblio, Mediafile, app, events ) {

    var allVids = function( cid, name ) {
	var self = this;

	self.years  = ko.observableArray([]);
	self.months = ko.observableArray([]);
        self.monthsLabels = ko.observableArray([]);
        self.videos = ko.observableArray([]);
        self.shouldBeVisible = ko.computed(function() {
            if(self.months().length >= 1) {
                return true;
            } else {
                return false;
            }
        });
	self.cid = cid;
        
        self.getVidsData = ko.observable();
        
        self.name = ko.observable(name);
        /*self.firstName = ko.computed(function() {
            if ( name ) {
                return name.slice( 0, name.indexOf(' ') );
            } else {
                return null;
            }
        });*/
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
    
    // Get the number of mediafiles so the allVids style can be decided on.
    // 3 or more mediafiles gets the normal view, while less than 3 gets 
    // the "Got more videos?" view.
    allVids.prototype.getHits = function() {
        var self = this;
	var args = {};
	if ( self.cid ) {
            viblio.api('/services/faces/contact_mediafile_count?cid=' + self.cid).then( function( data ) {
                self.hits(data.count);
            });
        } else {
            // can send a user uuid in args to get number of videos for specific user: {uid: uuid}
            viblio.api( '/services/mediafile/count', args ).then( function( data ) {
                self.hits(data.count);
            });
        }
    };
    
    allVids.prototype.goToUpload = function() {
        router.navigate( 'getApp?from=allVideos' );
    };

    // Toggle edit mode.  This will put all of media
    // files in the strip into/out of edit mode.  I'm thinking
    // this will be the way user's can delete their media files
    allVids.prototype.toggleEditMode = function() {
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

    allVids.prototype.fetch = function( year, month ) {
	var self = this;
        var theMonth = month;
	var args = { year: year };
	if ( self.cid ) args['cid'] = self.cid;
	viblio.api( '/services/yir/videos_for_year', args ).then( function( data ) {
	    self.months.removeAll();
            data.media.forEach( function( month ) {
                var mediafiles = ko.observableArray([]);
                if(month.month == theMonth) {
                    self.videos([]);
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
                        self.videos.push(m);
                    });
                    self.months.push({month: month.month, media: mediafiles});
                }
            });    
	});
    };
    
   allVids.prototype.monthSelected = function( self, month ) {
	self.monthsLabels().forEach( function( m ) {
	    m.selected( false );
	});
	month.selected( true );
	self.editLabel( 'Edit' );
	//viblio.mpEvent( 'yir' );
        console.log(month);
	self.getVids( month.label );
    };
    
    allVids.prototype.getMonths = function( cid ) {
        var self = this;
        var args = "";
        if( cid ) {
            args = "?cid=" + cid;
        }
        viblio.api( '/services/yir/months', args ).then( function(data) {
            data.months.forEach( function( month ) {
                self.monthsLabels.push( { "label": month, "selected": ko.observable(false) } );
            });
        });
    };
    
    allVids.prototype.getVids = function( month, year, cid ) {
	var self = this;
	var args = "?month=" + month;
        if ( year ) {
            args += "?year=" + year;
        }
	if ( cid ) {
            args += "?cid=" + cid;
        }
	viblio.api( '/services/yir/videos_for_month' + args ).then( function( data ) {
            self.getVidsData(data);
	    self.videos.removeAll();
	    data.media.forEach( function( mf ) {
                var m = new Mediafile( mf );
                m.on( 'mediafile:play', function( m ) {
                    router.navigate( 'new_player?mid=' + m.media().uuid );
                });
                m.on( 'mediafile:delete', function( m ) {
                    viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
                        viblio.mpEvent( 'delete_video' );
                        self.videos().remove( m );
                    });
                });
                self.videos.push(m);
	    });
	});
    };

    allVids.prototype.activate = function() {
	var self = this;
	var args = {};
        self.getHits();
        self.getMonths();
        /*
	if ( self.cid ) args['cid'] = self.cid;
	return viblio.api( '/services/yir/years', args ).then( function( data ) {
            console.log(ko.toJSON(data));
	    /*var arr = [];
	    data.years.forEach( function( year ) {
		arr.push({ label: year, selected: ko.observable(false) });
	    });
	    self.years( arr );
	    // self.years.push({ label: '2012', selected: ko.observable(false) }); // TEST DATA
	    if ( data.years.length >= 1 ) {
		self.years()[0].selected( true );
		self.fetch( self.years()[0].label );
	    }
            
            data.years.forEach(function(y){
                console.log(y);
                self.getVids(y);
                
            });
            
	});*/
    };
    
    // Animation callbacks
    this.showElement = function(elem) { if (elem.nodeType === 1) $(elem).hide().fadeIn('slow'); };
    this.hideElement = function(elem) { if (elem.nodeType === 1) $(elem).fadeOut(function() { $(elem).remove(); }); };

    return allVids;

});
