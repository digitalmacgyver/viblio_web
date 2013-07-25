define(['durandal/app','viewmodels/mediahstrip'],function(app,MediaHStrip) {
    var strips = ko.observableArray([]);
    
    return {
        displayName: 'Channels',
        strips: strips,
        activate: function () {
	    strips.removeAll();
            strips.push( new MediaHStrip( 'All Media', 'Everything there is...' ).search() );
            strips.push( new MediaHStrip( 'Favs', 'You took em!' ).search() );
        }
    };

});
