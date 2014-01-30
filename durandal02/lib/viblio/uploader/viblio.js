(function($) {
    var viblio = function() {
    };

    // Initialize the toolkit.  apikey is required.  cid,
    // a community id, is optional.  If not specified here,
    // then it is required at authenticate() time.
    // endpoint is optional and defaults to the production
    // viblio server.  Use https://staging.viblio.com for
    // testing.
    viblio.prototype.init = function( apikey, cid, endpoint ) {
	this.apikey = apikey; // required
	this.cid = cid;       // optional
	this.endpoint = endpoint || 'https://viblio.com';
    };

    // Optional.  If installed, this is called instead of
    // deferred.reject().  Gets same argument as reject.
    viblio.prototype.error_handler = function( handler ) {
	this.err = handler;
    };

    // Return the full url to viblio
    viblio.prototype.service = function( path ) {
	return this.endpoint + path;
    };

    // Call an API
    viblio.prototype.api = function( path, data ) {
	var self = this;
	var deferred = $.Deferred();
	var promise  = deferred.promise();
	var x = $.ajax({
	    url: self.service( path ),
	    data: data,
	    method: 'POST',
	    dataType: 'jsonp' });
	x.fail( function( xhr, text, error ) {
	    var code = xhr.status || 403
	    var message = xhr.responseText;
	    if ( message == "" )
		message = "Authentication Failure";
	    var data = { error: 1,
			 code: code,
			 message: message };
	    if ( self.err ) 
		self.err( data );
	    else
		deferred.reject( data );
	});
	x.done( function( data, status, xhr ) {
	    if ( data && data.error ) {
		if ( self.err )
		    self.err( data );
		else 
		    deferred.reject( data );
	    }
	    else {
		deferred.resolve( data );
	    }
	});
	return promise;
    };
    
    // userid is partner unique userid.  cid is the community id;
    // if not specified here, then use the cid specified in init().
    //
    viblio.prototype.authenticate = function( userid, cid ) {
	var self = this;
	cid = cid || self.cid;
	self.userid = userid;
	return self.api( '/services/na/authenticate',
			 { realm: 'community',
			   apikey: self.apikey,
			   cid: cid,
			   uuid: '682DC812-05C3-11E3-839F-54DE3DA5649D',
			   userid: userid }).then( function( data ) {
			       // capture the viblio uuid for anyone
			       // who needs it in the future.
			       if ( data && data.user )
				   self.uuid = data.user.uuid;
			       return data;
			   });
    };

    // Return the viblio uuid for the authenticated user
    viblio.prototype.vid = function() {
	return this.uuid;
    };

    // Return the partner userid for the authenticated user
    viblio.prototype.uid = function() {
	return this.userid;
    };

    window.viblio = new viblio();
})(jQuery);
