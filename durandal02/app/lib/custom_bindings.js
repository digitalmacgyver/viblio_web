/* 
   Custom Knockout Bindings
   General useage:
     <div data-bind="name: {}"></div>
*/
define(['durandal/app', 'lib/config', 'durandal/system'],function(app, config, system) {

    // Used to edit the video title and description on Player Page
    ko.extenders.liveEditor = function (target) {
        target.editing = ko.observable(false);
        var oldVal = ko.observable( null );
        
        target.edit = function () {
            // if the target's value starts with 'Click to' then clear all before editing
            if( target().slice(0,8) === 'Click to' ) {
                target('');
            }
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
                // ensure that the call is also triggered by app so the rest of the app can be notified when triggered
                if ( o != app ) {
                    app.trigger( targetName, data );
                }
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
	    var div     = $("<div></div>");
	    var ok_btn  = $("<i/>").addClass( 'icon-thumbs-up pull-right' ).appendTo(div);
	    var span    = $("<span/>").text( tag2.name() ).appendTo(div);
	    $element.empty();
	    $element.append( div );
	    $element.addClass( 'tag2-query' );

	    if ( tag2.changed ) {
		div.on( 'click', function() {
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
	    var tag3 = {mode: 'popup', display: null, only_known: false};
	    //build a new object that has the global options with overrides from the binding
            $.extend(true, tag3, ko.bindingHandlers.tag3);
            if (value.options && tag3.options) {
                ko.utils.extend(tag3.options, value.options);
                delete value.options;
            }
            ko.utils.extend(tag3, value);
            $element.addClass( 'tag3-editable' );
	    $element.editable({
		display: tag3.display,
		mode: tag3.mode,
		type: 'typeahead',
		value: ( tag3.name() == 'unknown' ? null : tag3.name() ),
		source: '/services/faces/all_contacts',
		sourceCache: false,
		sourceError: 'Sorry, we encountered an error.',
		sourceOptions: {
		    data: { editable: 1 }
		},
		typeahead: {
		    minLength: 2,
		    highlighter: function( item ) {
			var src, provider;
			$.ajax({
			    url: '/services/faces/avatar_for_name',
			    data: { contact_name: item.text },
			    async: false,
			    success: function( data ) {
				src = data.url;
				provider = data.provider;
			    }
			});
			return '<img style="width: 30px; height: 30px; margin-right: 6px;" src="' + src + '"/><strong>' + item.text + '</strong><p class="contactSource"><span>Source: </span>' + provider + '</p>';
		    }
		},
		validate: function( value ) {
		    var v = $.trim(value);
		    if ( v == '' ) {
			return 'Please input a name.';
		    }
		    else {
			if ( tag3.only_known ) {
			    var e = false;
			    $.ajax({
				url: '/services/faces/contact_for_name',
				data: { contact_name: v },
				async: false,
				success: function( data ) {
				    if ( data && data.contact && data.contact.picture_uri ) {
					e = false;
				    }
				    else {
					e = true;
				    }
				},
				error: function() {
				    e = true;
				}
			    });
			    if ( e ) 
				return 'Please choose an existing contact';
			    else
				return { newValue: v };
			}
			else {
			    return { newValue: v };
			}
		    }
		},
		success: function( res, newvalue ) {
		    var oldvalue = tag3.name();
		    tag3.name( newvalue );
		    if ( tag3.changed )
			tag3.changed.call( bindingContext['$data'], newvalue, oldvalue );
		}
	    });
	}
    };

    // slile elements up and down when they become visible
    ko.bindingHandlers.slideVisible = {
	init: function(element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
	},
	update: function(element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            ko.unwrap(value) ? $(element).slideDown() : $(element).slideUp();
	}
    };

    // smoothDivScroll
    //
    // Usage:  data-bind="hscroller:{ options }"
    // where options can be zero or more of the following:
    //   setupComplete: a function to call when the scroller has completed its setup.
    //   rightLimmitReached: a function to call when the scroller hits the end of data on the right
    //
    // User's of this binding, if dynamically adding and/or removing elements, must call
    //   $element.trigger( 'children-changed', [ { enable: true } ] )
    //
    // Which will cause the scroller to recalculate its geometry and display or hide its
    // hot spots as needed.  { enable: true } can be passed to re-enable the scroller
    // if it was paused in the parent during an infinite scroll data fetch.
    //
    ko.bindingHandlers.hscroller = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    var $element = $(element);
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};
	    var hscroller = {};
	    //build a new object that has the global options with overrides from the binding
            $.extend(true, hscroller, ko.bindingHandlers.hscroller);
            if (value.options && hscroller.options) {
                ko.utils.extend(hscroller.options, value.options);
                delete value.options;
            }
            ko.utils.extend(hscroller, value);

	    // Add a common class name for all such scrollers
	    $element.addClass( "horizontal-scroller" );

	    if ( ! head.mobile ) {
		// Automatically add the hot spot overrides we use in viblio
		$('<button class="btn btn-small fwd btn-nav mCSB_buttonRight"><img src="css/images/arrowRight.png"/></button>').appendTo( $element );
		$('<button class="btn btn-small back btn-nav mCSB_buttonLeft"><img src="css/images/arrowLeft.png"/></button>').appendTo( $element );
	    }

	    // Create the scroller
	    $element.smoothDivScroll({
		scrollingHotSpotLeftClass: "mCSB_buttonLeft",
		scrollingHotSpotRightClass: "mCSB_buttonRight",
		hotSpotScrolling: ( head.mobile ? false: true),
		touchScrolling: ( head.mobile ? true : false ),
		visibleHotSpotBackgrounds: 'always',
		setupComplete: function() {
		    if ( hscroller.setupComplete )
			hscroller.setupComplete.call( bindingContext['$data'] );
		},
		scrollerRightLimitReached: function() {
		    if ( hscroller.rightLimitReached )
			hscroller.rightLimitReached.call( bindingContext['$data'] );
		    else 
			// This hides the right fwd button when no data is left
			$element.smoothDivScroll("nomoredata");
		}
            });
	    // Initialize the scroller (viblio hack)
	    $element.trigger( 'initialize' );

	    // Set up the handler for children-changed, so we can redraw
	    $element.on( 'children-changed', function( e, opts ) {
		$element.smoothDivScroll("recalculateScrollableArea");
		if ( ! head.mobile )
		    $element.smoothDivScroll("redoHotSpots");
		if ( opts && opts.enable ) 
		    $element.smoothDivScroll("enable" );
	    });

	    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).smoothDivScroll("destroy");
            });
	}
    };
    
    // Bind to Return keypress.
    // Use like this: data-bind="returnKey:send"
    ko.bindingHandlers.returnKey = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            ko.utils.registerEventHandler(element, 'keydown', function(evt) {
                if (evt.keyCode === 13) {
                    evt.preventDefault();
                    evt.target.blur();
                    //valueAccessor().call(viewModel);
                }
            });
        }
    };
    
    // resize textarea when text is added
    ko.bindingHandlers.jqAutoresize = {
        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            $(element).autosize();
        }           
    };

    // Makes a container drop-on-able
    ko.bindingHandlers.droponable = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    var $element = $(element);
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};
	    var droponable = {};
	    //build a new object that has the global options with overrides from the binding
            $.extend(true, droponable, ko.bindingHandlers.droponable);
            if (value.options && droponable.options) {
                ko.utils.extend(droponable.options, value.options);
                delete value.options;
            }
            ko.utils.extend(droponable, value);

	    $(element).droppable({
		scope: droponable.scope,
		hoverClass: droponable.hoverClass,
		drop: function( event, ui ) {
		    droponable.callback.call( bindingContext['$data'], ko.dataFor( $(ui.draggable).get(0) ) );
		}
	    });
	}
    };

    // Add a tooltip to an element. 
    // data-bind="tooltip:{bootstrap-tooltip-options}"
    // Visit http://getbootstrap.com/2.3.2/javascript.html#tooltips for list of options
    // data-bind="tooltip:{title:'This is the tip'}"
    ko.bindingHandlers.tooltip = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    var $element = $(element);
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};
	    var tooltip = {};
	    //build a new object that has the global options with overrides from the binding
            $.extend(true, tooltip, ko.bindingHandlers.tooltip);
            if (value.options && tooltip.options) {
                ko.utils.extend(tooltip.options, value.options);
                delete value.options;
            }
            ko.utils.extend(tooltip, value);
	    $(element).tooltip( tooltip );
	}
    };
    
    // Add a popover to an element. 
    // data-bind="popover:{Option1: val, Option2: val, title: string, content: string}"
    // Visit http://getbootstrap.com/2.3.2/javascript.html#popovers for list of options
    ko.bindingHandlers.popover = {
	init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    var $element = $(element);
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};
	    var popover = {};
	    //build a new object that has the global options with overrides from the binding
            $.extend(true, popover, ko.bindingHandlers.popover);
            if (value.options && popover.options) {
                ko.utils.extend(popover.options, value.options);
                delete value.options;
            }
            ko.utils.extend(popover, value);
	    $(element).popover( popover );
	}
    };

    return({});
});
