define(['durandal/app', 'plugins/router', 'lib/viblio', 'durandal/events',], function(app,router,viblio,events) {
    var Help = function( content, type ) {
        var self = this;
        self.content = content;
        self.topDistance = ko.observable();
        self.type = type;
    };
    
    Help.prototype.toggleInstructions = function(data, event) {
        var self = this;
        if( $(event.currentTarget).hasClass('helptab') ) {
            $(event.currentTarget).siblings('.helpBody').slideToggle(500);
            $(event.currentTarget).parent().toggleClass('active');
        } else {
            $(event.currentTarget).slideToggle(500);
            $(event.currentTarget).toggleClass('active');
        }
    };
    
    return Help;
    
});       