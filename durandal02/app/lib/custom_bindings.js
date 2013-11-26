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
	    $element.addClass( 'tag1-accepted' );

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

    return({});
});
