define(['durandal/app', 'plugins/router', 'lib/viblio', 'durandal/events',], function(app,router,viblio,events) {
    var Help = function( content ) {
        var self = this;
        self.content = content;
        self.topDistance = ko.observable();
    };
    
    Help.prototype.toggleInstructions = function() {
        var self = this;
        if( $( '.helpContainer' ).css( 'top' ) == self.topDistance() + 'px' ) {
            if( $( window ).width() > '900' ) {
                $( '.helpContainer' ).css( 'top', '65px' );
            } else {
                $( '.helpContainer' ).css( 'top', '0' );
            }
            $( '.helpContainer .helptab' ).css( 'opacity', '.8');
            $( '.helpContainer .helptab' ).off( "mouseenter mouseleave" );
        } else {
            $( '.helpContainer' ).css( 'top', self.topDistance() );
            $( '.helpContainer .helptab' ).css( 'opacity', '.6');
            $( '.helpContainer .helptab' ).hover( function(){ $(this).css( 'opacity', '.8'); }, function(){ $(this).css( 'opacity', '.6'); } );
        } 
    };
    
    Help.prototype.getHeight = function( s ) {
        if( $( window ).width() > '900' ) {
            s.topDistance( -$( '.helpBody' ).height() + 45 );
        } else {
            s.topDistance( -$( '.helpBody' ).height() - 16 );
        }
    };
    
    Help.prototype.moveHelp = function( self ) {
        var s = self.data.self;
        s.getHeight( s );
        $( '.helpContainer' ).css( 'top', s.topDistance() );
    };
    
    Help.prototype.compositionComplete = function() {
        var self = this;
        self.getHeight( self );
        $( '.helpContainer' ).css( 'top', self.topDistance() );
        
        $(window).bind( "resize.Help", {self: self}, self.moveHelp );
    };
    
    Help.prototype.detached = function() {
        $(window).unbind( "resize.Help" );
    };
    
    return Help;
    
});       