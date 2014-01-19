define(['plugins/dialog'],function(dialog){
    return{
	close: function() {
	    dialog.close( this );
	},
	attached: function( view ) {
	    // This special modal needs to be wider and higher than the
	    // standard dialog ...
	    var w = $(window).width() * 0.8;
	    $(view).width( w );
	    $(view).css( 'margin-left', '-' + (w/4) + 'px' );
	    $(view).find(".closeX").css( 'right', '-' + (w/4) + 'px' );
	}
    };
});
