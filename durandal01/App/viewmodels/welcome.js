define(['lib/viblio'],function(viblio) {
    var welcome = function () {
        this.displayName = 'Welcome to the Durandal Starter Kit!';
        this.description = 'Durandal is a cross-device, cross-platform client framework written in JavaScript and designed to make Single Page Applications (SPAs) easy to create and maintain.';
        this.features = [
            'Clean MV* Architecture',
            'JS & HTML Modularity',
            'Simple App Lifecycle',
            'Eventing, Modals, Message Boxes, etc.',
            'Navigation & Screen State Management',
            'Consistent Async Programming w/ Promises',
            'App Bundling and Optimization',
            'Use any Backend Technology',
            'Built on top of jQuery, Knockout & RequireJS',
            'Integrates with other libraries such as SammyJS & Bootstrap',
            'Make jQuery & Bootstrap widgets templatable and bindable (or build your own widgets).'
        ];
	this.me = ko.observable();
    };

    welcome.prototype.viewAttached = function (view) {
        //you can get the view after it's bound and connected to it's parent dom node if you want
    };

    welcome.prototype.uname = function() {
	var self = this;
	viblio.api( '/services/user/mexx' ).then( function( json ) {
	    var them = 'unknown';
	    if ( json && json.user && json.user.displayname )
		them = json.user.displayname;
	    self.me( them );
	});
    };

    return welcome;
});