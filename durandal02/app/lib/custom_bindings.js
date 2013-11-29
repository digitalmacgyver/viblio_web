/* 
   Custom Knockout Bindings
   General useage:
     <div data-bind="name: {}"></div>
*/
define(['durandal/app', 'lib/config', 'durandal/system', 'viewmodels/mediavstrip'],function(app, config, system, vstrip) {

    // Used to edit the video title and description on Player Page
    ko.extenders.liveEditor = function (target) {
        target.editing = ko.observable(false);
        var oldVal = ko.observable( null );
        
        target.edit = function () {
            target.editing(true);
            oldVal = target();
        };

        target.stopEditing = function () {
            target.editing(false);
        };
        
	// The save function. 
	// obj: The object to send an event message to.  If null, then use app object
	// data: Date to send to obj via event message
	// targetName: The event message name to send
        target.save = function( obj, data, targetName ) {
            if( oldVal != target() ) {
		var o = obj;
		if ( ! o ) {
		    o = app;
		}
                o.trigger( targetName, data ); 
            }
        };
        
        return target;
    };
    
    // Used to edit the video title and description on Player Page
    ko.bindingHandlers.liveEditor = {
        init: function (element, valueAccessor) {
            var observable = valueAccessor();
            observable.extend({ liveEditor: this });
        },
        update: function (element, valueAccessor) {
            var observable = valueAccessor();
            ko.bindingHandlers.css.update(element, function () { return { editing: observable.editing }; });
        }
    };
    
    ko.bindingHandlers.highlightChange = {
       origValue : null,
       init: function (element, valueAccessor) {
           origValue = '';
       },
       update: function (element, valueAccessor) {
           if (origValue !== valueAccessor())
           {
               $(element).hide().fadeIn('slow');
           }
       }
    };

    ko.bindingHandlers.tag1 = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    var $element = $(element);
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};
	    var tag1 = { state: 'accept' };
	    //build a new object that has the global options with overrides from the binding
            $.extend(true, tag1, ko.bindingHandlers.tag1);
            if (value.options && tag1.options) {
                ko.utils.extend(tag1.options, value.options);
                delete value.options;
            }
            ko.utils.extend(tag1, value);

	    tag1.orig = tag1.name();

	    if ( tag1.state == 'accept' ) 
		$element.addClass( 'tag1-accepted' );
	    else
		$element.addClass( 'tag1-rejected' );

	    $element.on( 'mouseover', function( e ) {
		$element.removeClass( 'tag1-accepted' );
		$element.removeClass( 'tag1-rejected' );
		$element.toggleClass( 'tag1-hover' );
		if ( tag1.state == 'accept' ) 
		    $element.text( 'click to reject' );
		else 
		    $element.text( 'click to accept' );
	    });

	    $element.on( 'mouseleave', function( e ) {
		$element.toggleClass( 'tag1-hover' );
		if ( tag1.state == 'accept' ) { 
		    $element.addClass( 'tag1-accepted' );
		}
		else {
		    $element.addClass( 'tag1-rejected' );
		}
		$element.text( tag1.name() );
	    });

	    $element.on( 'click', function( e ) {
		if ( tag1.state == 'accept' ) {
		    tag1.state = 'reject';
		    tag1.name( 'Not ' + tag1.orig );
		    $element.removeClass( 'tag1-accepted' );
		    $element.addClass( 'tag1-rejected' );
		}
		else {
		    tag1.state = 'accept';
		    tag1.name( tag1.orig );
		    $element.addClass( 'tag1-accepted' );
		    $element.removeClass( 'tag1-rejected' );
		}

		if ( tag1.changed ) 
		    tag1.changed.call( bindingContext['$data'], tag1.state );

		if ( e.preventDefault ) 
                    e.preventDefault();

	    });
	}

    };

    ko.bindingHandlers.tag2 = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    var $element = $(element);
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};
	    var tag2 = { state: 'accept' };
	    //build a new object that has the global options with overrides from the binding
            $.extend(true, tag2, ko.bindingHandlers.tag2);
            if (value.options && tag2.options) {
                ko.utils.extend(tag2.options, value.options);
                delete value.options;
            }
            ko.utils.extend(tag2, value);

	    //var del_btn = $("<i/>").addClass( 'icon-remove-circle pull-right');
	    var ok_btn  = $("<i/>").addClass( 'icon-thumbs-up pull-right' );
	    var span    = $("<span/>").text( tag2.name() );
	    $element.empty();
	    $element.append( ok_btn ).append( span );
	    $element.addClass( 'tag2-query' );

	    if ( tag2.changed ) {
		//del_btn.on( 'click', function() {
		//    tag2.changed.call( bindingContext['$data'], 'no' );
		//});
		ok_btn.on( 'click', function() {
		    tag2.changed.call( bindingContext['$data'], 'yes' );
		});
	    }
	},
	update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    var $element = $(element);
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};
	    var tag2 = { state: 'accept' };
	    //build a new object that has the global options with overrides from the binding
            $.extend(true, tag2, ko.bindingHandlers.tag2);
            if (value.options && tag2.options) {
                ko.utils.extend(tag2.options, value.options);
                delete value.options;
            }
            ko.utils.extend(tag2, value);
	    $element.find( 'span' ).text( tag2.name() );
	}
    };

    ko.bindingHandlers.tag3 = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    var $element = $(element);
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};
	    var tag3 = { state: 'accept' };
	    //build a new object that has the global options with overrides from the binding
            $.extend(true, tag3, ko.bindingHandlers.tag3);
            if (value.options && tag3.options) {
                ko.utils.extend(tag3.options, value.options);
                delete value.options;
            }
            ko.utils.extend(tag3, value);
	    $element.addClass( 'tag3-editable' );
	    $element.editable({
		mode: 'popup',
		type: 'typeahead',
		source: '/services/faces/all_contacts',
		sourceCache: false,
		sourceError: 'Sorry, we encountered an error.',
		sourceOptions: {
		    data: { editable: 1 }
		},
		typeahead: {
		    minLength: 2,
		    highlighter: function( item ) {
			var src;
			$.ajax({
			    url: '/services/faces/avatar_for_name',
			    data: { contact_name: item.text },
			    async: false,
			    success: function( data ) {
				src = data.url;
			    }
			});
			return '<img style="width: 30px; height: 30px; margin-right: 3px;" src="' + src + '"/><strong>' + item.text + '</strong>';
		    }
		},
		validate: function( value ) {
		    var v = $.trim(value);
		    if ( v == '' ) {
			return 'Please input a name.';
		    }
		    else {
			return { newValue: v };
		    }
		},
		success: function( res, newvalue ) {
		    tag3.name( newvalue );
		    if ( tag3.changed )
			tag3.changed.call( bindingContext['$data'], newvalue );
		}
	    });
	}
    };

    return({});
});
