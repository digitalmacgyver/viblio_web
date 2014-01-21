define(['durandal/app'],function(app){
    var view;
    var unnamed;
    var top_actors;

    app.on( 'unnamed:composed', function( obj ) {
	unamed = obj;
    });

    app.on( 'top-actors:composed', function( obj ) {
	top_actors = obj; 
    });

    app.on( 'unnamed:visibility', function( visible ) {
	if ( visible ) {
	    $(view).find( '.top-strip .cont' ).css( 'margin-right', '-340px' );
	    //$(view).find( '.top-strip .cont .left' ).css( 'margin-right', '340px' );
	    //$(view).find( '.top-strip .cont' ).animate({ 'margin-right': '-340px' });
	    $(view).find( '.top-strip .cont .left' ).animate({ 'margin-right': '340px' });
	}
	else {
	    //$(view).find( '.top-strip .cont' ).css( 'margin-right', '0px' );
	    //$(view).find( '.top-strip .cont .left' ).css( 'margin-right', '0px' );
	    $(view).find( '.top-strip .cont' ).animate({ 'margin-right': '0px' });
	    $(view).find( '.top-strip .cont .left' ).animate({ 'margin-right': '0px' });
	}
	$(top_actors.view).find( ".sd-pscroll").trigger( 'children-changed' );
    });

    return{
	compositionComplete: function( _view ) {
	    view = _view;
	}
    };
});
