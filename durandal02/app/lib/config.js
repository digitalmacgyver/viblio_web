/*
  Application config
*/
define( function() {
    // In development, the Facebook appids are dependent on the
    // environment in which we are running this application.
    //
    var site = {
	'viblio.com': {
	    facebook: '613586332021367',
	    csponge: '24DEYTURHGHAP7XL5ARS',
	    cloudfront: 's3vrmtwctzbu8n.cloudfront.net',
	    email: 'support.viblio.com',
	    uploader: 'viblio.com'
	},
	'cat.viblio.com': {
	    facebook: '613586332021367',
	    csponge: '24DEYTURHGHAP7XL5ARS',
	    cloudfront: 's3vrmtwctzbu8n.cloudfront.net',
	    email: 'support.viblio.com',
	    uploader: 'cat.viblio.com'
	},
	'staging.viblio.com': {
	    facebook: '153462094815829',
	    csponge: 'VPP8BMSQ5AK6JLNRPKCV',
	    cloudfront: 's2gdj4u4bxrah6.cloudfront.net',
	    email: 'support-staging.viblio.com',
	    uploader: 'staging.viblio.com'
	},
	'prod.viblio.com': {
	    facebook: '538791729508064',
	    csponge: 'JQRKUZQYADSCHG5NJQ5P',
	    cloudfront: 's3vrmtwctzbu8n.cloudfront.net',
	    email: 'support-prod.viblio.com',
	    uploader: 'prod.viblio.com'
	},
	'192.168.220.189': {
	    facebook: '566096966734454',
	    csponge: 'FD7C6RP5SE8ERDMB3RHR'
	},
	'localhost': {
	    csponge: 'VXKUHY8HEWA3TSXSXQL6'
	}
    };

    // Given the host we are accessing, and a service, return
    // the pertainent host-specific info we're looking for.
    // If the host is not in our struct, or it is but does
    // not have the service defined, (which will be the case
    // when using development machines) then fallback to staging.viblio.com.
    //
    function service( host, svc ) {
	var the_host = host;
	if ( ! site[the_host] ) the_host = 'staging.viblio.com';
	var the_svc = svc;
	if ( ! site[the_host][the_svc] ) the_host = 'staging.viblio.com';
	return site[the_host][the_svc];
    }

    var myLocation = '//' + window.location.hostname;
    if ( window.location.port )
	myLocation += ':' + window.location.port;

    return {
	// When the application wants a route name (or hash) it
	// comes here with a logical name that can be mapped to
	// a physical name, so we have a single place to
	// change things instead of hacking up the main code.
	//
	routes: {
	    login: 'login',
	    landing: 'welcome',
	    channel: 'channel',
	    player: 'new_player'
	},

	site_server: myLocation,

	// Facebook params.
	facebook_appid: function() {
	    return service( window.location.hostname, 'facebook' );
	},
	facebook_channel: function() {
	    return myLocation + '/Content/channel.html';
	},
	facebook_ask_features: function() {
	    return 'email,user_photos,user_videos,read_friendlists,friends_photos,friends_videos';
	},
	cloudsponge_appid: function() {
	    return service( window.location.hostname, 'csponge' );
	},
	geoLocationOfVideoAnalytics: "37.451269,-122.158495",
	cf_domain: function() {
	    return service( window.location.hostname, 'cloudfront' );
	},
	email_domain: function() {
	    return service( window.location.hostname, 'email' );
	},
	uploader: function() {
	    var the_host = window.location.hostname;
	    var the_svc = 'uploader';
	    if ( ! site[the_host] ) return the_host;
	    if ( ! site[the_host][the_svc] ) return the_host;
	    return site[the_host][the_svc];
	}
    };
});
