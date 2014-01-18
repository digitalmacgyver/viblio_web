define([], function() {

    var title = ko.observable();
    var view  = ko.observable();
    var selected = ko.observable({});
    var last_selected = 'yv-all';
    selected()[last_selected] = true;

    title( 'Your Videos' );
    view( 'viewmodels/yv-all' );

    return {
	title: title,
	view: view,
	selected: selected,

	screen: function( _title, _model ) {
	    title( _title );
	    view( 'viewmodels/' + _model );
	    var s = selected();
	    s[last_selected] = false;
	    last_selected = _model;
	    s[last_selected] = true;
	    selected( s );
	},
	compositionComplete: function() {
	}
    };
});
