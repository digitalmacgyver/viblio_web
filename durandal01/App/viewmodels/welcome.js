/*
  The channels page, which I think is the default page for an authenticated
  user.
*/
define(['durandal/app','viewmodels/mediahstrip'],function(app,MediaHStrip) {
    // A list of horizontal media display lists
    var strips = ko.observableArray([]);
    
    return {
        displayName: 'Channels',
        strips: strips,
        activate: function () {
	    strips.removeAll();
	    // Pretty simple at the moment; just instanciate a couple
	    // of media strips for demo purposes.  At some point these
	    // calls will be made with some sort of search criterion
	    // unique to each strip.
            strips.push( new MediaHStrip( 'All Media', 'Everything there is...' ).search() );
            strips.push( new MediaHStrip( 'Favs', 'You took em!' ).search() );
        }
    };

});
