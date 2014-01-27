define([], function() {

    var title = ko.observable();
    var view  = ko.observable();
    //var selected = ko.observable({});
    var last_selected = ko.observable( null );
    //selected()[last_selected] = true;

    return {
	title: title,
	view: view,
	//selected: selected,
        last_selected: last_selected,
        
        screen: function( _title, _model ) {
	    title( _title );
	    view( 'viewmodels/' + _model );
            last_selected( _model );
	},
        
        compositionComplete: function() {
            if( last_selected() == null ) {
                last_selected('yv-all');
                title( 'Your Videos' );
                view( 'viewmodels/yv-all' );
            }
        }
        
    };
});
