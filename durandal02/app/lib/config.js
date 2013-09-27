/*
  Application config
*/
define( function() {
    // In development, the Facebook appids are dependent on the
    // environment in which we are running this application.
    //
    var fbInfo = {
	'http://192.168.1.21': '566096966734454',
	'https://192.168.1.35': '566096966734454',
	'http://staging.viblio.com': '153462094815829',
	'https://staging.viblio.com': '153462094815829',
	'http://prod.viblio.com': '538791729508064',
	'https://prod.viblio.com': '538791729508064',
	'http://10.100.8.99': '357358674377173',
	'http://10.100.10.61': '357358674377173'
    };
    var csponge = {
	'http://192.168.1.35': 'FD7C6RP5SE8ERDMB3RHR',
	'http://staging.viblio.com': 'VPP8BMSQ5AK6JLNRPKCV'
    };
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
	    player: 'player'
	},

	site_server: myLocation,

	// Facebook params.
	facebook_appid: function() {
	    return fbInfo[window.location.protocol + myLocation];
	},
	facebook_channel: function() {
	    return myLocation + '/Content/channel.html';
	},
	facebook_ask_features: function() {
	    return 'email,user_photos,user_videos,read_friendlists,friends_photos,friends_videos';
	},
	cloudsponge_appid: function() {
	    return csponge[window.location.protocol + myLocation];
	},
	geoLocationOfVideoAnalytics: "37.451269,-122.158495"
    };
});
