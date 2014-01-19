define(['plugins/dialog'],function(dialog){
    return{
	close: function() {
	    dialog.close( this );
	},
	compositionComplete: function( view ) {
	    // This special modal needs to be wider and higher than the
	    // standard dialog ...
	    var w = $(window).width() * 0.8;
	    $(view).width( w );

	    var ml = (($(window).width() / 2)-300)-($(window).width()*.1);

	    $(view).css( 'margin-left', '-' + ml + 'px' );
	    $(view).find(".closeX").css( 'right', '-' + ml + 'px' );

	    var available_height = $(window).height() - 200 - 40 - $(view).height();
	    $(view).find( ".file-container").height( available_height );
	}
    };
});
