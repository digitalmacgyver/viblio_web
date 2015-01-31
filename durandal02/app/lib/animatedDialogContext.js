/**
   This is a custom varient of the standard Durandal dialog plugin.  This is 
   essencialy an extension so all normal methods work, just like normal
   dialogs.

   This extension overrides the so-called context of the normal dialog class
   and does animation on the open and close operations.  The animation code
   was reverse engineered from the excellent alertify.js library.
**/
define( ['plugins/dialog'], function( dialog ) {

    var Context = function() {
    };

    Context.prototype.getTransitionEvent = function () {
        var t,
        type,
        supported   = false,
        el          = document.createElement("fakeelement"),
        transitions = {
            "WebkitTransition" : "webkitTransitionEnd",
            "MozTransition"    : "transitionend",
            "OTransition"      : "otransitionend",
            "transition"       : "transitionend"
        };
	
        for (t in transitions) {
            if (el.style[t] !== undefined) {
                type      = transitions[t];
                supported = true;
                break;
            }
        }
	
        return {
            type      : type,
            supported : supported
        };
    };

    Context.prototype.addHost = function(theDialog) {
        console.log( theDialog );
        var body = $('body');
        var blockout = $('<div class="modalBlockout"></div>')
            .css({ 'z-index': dialog.getNextZIndex(), 'opacity': this.blockoutOpacity })
            .appendTo(body);

        //var host = $('<div class="modalHost alertify-hidden"></div>')
        var host = $('<div class="modalHost alertify alertify-hidden"></div>')
            .css({ 'z-index': dialog.getNextZIndex() })
            .appendTo(body);

        theDialog.host = host.get(0);
        theDialog.blockout = blockout.get(0);

        if (!dialog.isOpen()) {
            theDialog.oldBodyMarginRight = body.css("margin-right");
            theDialog.oldInlineMarginRight = body.get(0).style.marginRight;
	    
            var html = $("html");
            var oldBodyOuterWidth = body.outerWidth(true);
            var oldScrollTop = html.scrollTop();
            $("html").css("overflow-y", "hidden");
            var newBodyOuterWidth = $("body").outerWidth(true);
            body.css("margin-right", (newBodyOuterWidth - oldBodyOuterWidth + parseInt(theDialog.oldBodyMarginRight)) + "px");
            html.scrollTop(oldScrollTop); // necessary for Firefox
        }
    };

    Context.prototype.removeHost = function(theDialog) {
	var transition = this.getTransitionEvent();

	var bind = function (el, event, fn) {
            if (typeof el.addEventListener === "function") {
		el.addEventListener(event, fn, false);
            } else if (el.attachEvent) {
		el.attachEvent("on" + event, fn);
            }
	};

	var unbind = function (el, event, fn) {
            if (typeof el.removeEventListener === "function") {
		el.removeEventListener(event, fn, false);
            } else if (el.detachEvent) {
		el.detachEvent("on" + event, fn);
            }
	};

	var finish = function() {
            $(theDialog.host).css('opacity', 0);
            $(theDialog.blockout).css('opacity', 0);
	
            setTimeout(function() {
		ko.removeNode(theDialog.host);
		ko.removeNode(theDialog.blockout);
            }, this.removeDelay);
	
            if (!dialog.isOpen()) {
		var html = $("html");
		var oldScrollTop = html.scrollTop(); // necessary for Firefox.
		html.css("overflow-y", "").scrollTop(oldScrollTop);
	    
		if(theDialog.oldInlineMarginRight) {
                    $("body").css("margin-right", theDialog.oldBodyMarginRight);
		} else {
                    $("body").css("margin-right", '');
		}
            }
	};

	var transitionDone = function( event ) {
	    event.stopPropagation();
	    unbind(this, transition.type, transitionDone);
	    finish();
	};

	if ( transition.supported ) {
	    bind( theDialog.host, transition.type, transitionDone );
	    $(theDialog.host).addClass( "alertify-hide" ).addClass( "alertify-hidden" );
	}
	else {
	    finish();
	}
    };

    Context.prototype.compositionComplete = function (child, parent, context) {
	var $child = $(child);
        var width = $child.width();
        var height = $child.height();
        var theDialog = dialog.getDialog(context.model);

	$(theDialog.host).removeClass( "alertify-hidden" );

        if ($(child).hasClass('autoclose')) {
            $(theDialog.blockout).click(function() {
                theDialog.close();
            });
        }
        
        $('.autofocus', child).each(function() {
            $(this).focus();
        });
        
        // center vertically
        /*$.when( context.model.compositionComplete() ).then( function() {
            console.log( 'compositionComplete is done' );
            
            console.log( "child: ", child, $(child).outerHeight(), "parent: ", parent, $(parent).height(), $(parent).height() - $(child).height() );
            console.log( 'context: ', context );
            
            var t = ( $(parent).height() - $(child).height() )/2; 
            $(child).css( "top", t > 0 ? t : 0 );
        });*/
    };

    return new Context();
});
