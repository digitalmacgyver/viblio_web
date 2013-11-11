define(['plugins/dialog', 'knockout', 'jquery'], function(dialog, ko) {
    var Loggly = function() {
	this.events  = ko.observableArray([]);
	this.tmr = null;
    };

    Loggly.prototype.fetch_data = function() {
	var self = this;
	// Initiate the search
	$.getJSON( '/start_search' ).then( function( res ) {
	    console.log( res );
	    if ( res.error ) {
		dialog.showMessage( res.message, "Loggly" );
	    }
	    else {
		var id = res.rsid.id;
		$.getJSON( '/search', { id: id } ).then( function( data ) {
		    console.log( 'data: ', data );
		    if ( data.error ) {
			dialog.showMessage( data.message, "Loggly" );
		    }
		    else {
			if ( data.total_events ) {
			    self.events([]);
			    data.events.forEach( function( ev ) {
				var d = new Date( ev.event.syslog.timestamp);
				var e = {
				    host: ev.event.syslog.host,
				    severity: ev.event.syslog.severity,
				    timestamp: d.toDateString() + ' ' + d.toTimeString(),
				    msg: ev.logmsg
				};
				self.events.push( e );
			    });
			}
			else {
			}
			console.log( 'Setting Timeout' );
			self.tmr = setTimeout( function() { self.fetch_data(); }, 30000 );
		    }
		});
	    }
	});
    };

    Loggly.prototype.compositionComplete = function() {
	var self = this;
	if ( self.tmr ) clearTimeout( self.tmr );
	self.tmr = null;
	self.fetch_data();
    };

    Loggly.prototype.dismiss = function() {
	if ( this.tmr )
	    clearTimeout( this.tmr );
	dialog.close( this );
    };

    return Loggly;

});