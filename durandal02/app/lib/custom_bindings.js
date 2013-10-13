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

    return({});
});
