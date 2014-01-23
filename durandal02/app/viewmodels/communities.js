define(['lib/customDialogs'], function(dialogs) {
    var comms = ko.observableArray([]);

    return {
	comms: comms,

	new_comm: function() {
	    dialogs.showMessage( "We can't wait for it either!", "Coming Soon" );
	}
    };
});
