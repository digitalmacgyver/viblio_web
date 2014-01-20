// This shim model allows the nginx upload page to be used as
// a modal popup.
//
define(['plugins/dialog'],function(dialog){
    return{
	close: function() {
	    dialog.close( this );
	},
	compositionComplete: function( view ) {
	    // This special modal needs to be wider and higher than the
	    // standard dialog ...
	    var w = $(window).width() * 0.8;
	    if ( w > 900 ) w = 900;
	    $(view).width( w );

	    var delta = ( $(window).width() - w ) / 2;

	    var ml = (($(window).width() / 2)-300)-(delta);

	    $(view).css( 'margin-left', '-' + ml + 'px' );
	    $(view).find(".closeX").css( 'right', '-' + ml + 'px' );

	    var available_height = $(window).height() - 200 - 40 - $(view).height();
	    if ( available_height < 250 ) available_height = 250;
	    $(view).find( ".file-container").height( available_height );
	}
    };
});
