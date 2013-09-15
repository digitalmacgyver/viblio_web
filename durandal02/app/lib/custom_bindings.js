/* 
   Custom Knockout Bindings
   General useage:
     <div data-bind="name: {}"></div>
*/
define(['durandal/app', 'lib/config', 'durandal/system', 'viewmodels/mediavstrip'],function(app, config, system, vstrip) {
    var videoel = document.createElement("video"),
    idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
    noflash = flashembed.getVersion()[0] === 0,
    simulate = !idevice && noflash &&
        !!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));

    // Apply modal fancybox popup with flowplayer to all a.fancybox elements in the
    // container in which this binding is applied.  
    // <div data-bind="modal_fancybox_flowplayer: {}"></div>
    //
    ko.bindingHandlers.modal_fancybox_flowplayer = {
	init: function( element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
	    $(element).find(".fancybox").fancybox({
		'transitionIn'	:	'elastic',
		'transitionOut'	:	'elastic',
		'speedIn'		:	800, 
		'speedOut'		:	400, 
		tpl: {
		    // wrap template with custom inner DIV: the empty player container
		    wrap: '<div class="fancybox-wrap" tabIndex="-1">' +
			'<div class="fancybox-skin">' +
			'<div class="fancybox-outer">' +
			'<div id="player">' + // player container replaces fancybox-inner
			'</div></div></div></div>' 
		},
		beforeShow: function () {
		    var uri = $(this.element).data( 'uri' );
		    $("#player").flowplayer( "/static/flowplayer/flowplayer-3.2.16.swf", {
			clip: {
			    url: 'mp4:amazons3/viblio-mediafiles/' + uri,
			    ipadUrl: encodeURIComponent($(this.element).data( 'url' )),
			    // URL for sharing on FB, etc.
			    pageUrl: config.site_server + '/shared/flowplayer/' + $(this.element).data( 'uuid' ),
			    //scaling: 'fit',
			    ratio: 9/16,
			    //splash: true,
			    provider: 'rtmp'
			},
			plugins: {
			    rtmp: {
				url: '/static/flowplayer/flowplayer.rtmp-3.2.12.swf',
				netConnectionUrl: 'rtmp://ec2-54-214-160-185.us-west-2.compute.amazonaws.com/vods3'
			    },
			    viral: {
				url: '/static/flowplayer/flowplayer.viralvideos-3.2.13.swf',
				share: { 
				    description: 'Video highlight by Viblio',
				    facebook: true,
				    twitter: true,
				    myspace: false,
				    livespaces: true,
				    digg: false,
				    orkut: false,
				    stumbleupon: false,
				    bebo: false
				},
				embed: false,
				email: false
			    }
			},
			canvas: {
			    backgroundColor:'#254558',
			    backgroundGradient: [0.1, 0]
			}
		    //}).flowplayer();
		}).flowplayer().ipad({simulateiDevice: simulate});
		// THIS STOPPED WORKING!! Possible fix: http://flash.flowplayer.org/forum/4/75157
		},
		beforeClose: function () {
		    // important! unload the player
		    var fp = flowplayer(); 
		    fp.unload();
		}
	    });
	},
	update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
	}
    };
    
    ko.bindingHandlers.smooth_div_scroll = {
	init: function( element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
	    $(element).find(".smooth-div-scrollable").smoothDivScroll({
		manualContinuousScrolling: false,
		mousewheelScrolling: "horizontal",
		touchScrolling: true
	    });
	},
	update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
	}
    };

    ko.bindingHandlers.mCustomScrollbar = {
        init: function(element, valueAccessor) {
            var options = ko.utils.unwrapObservable(valueAccessor()),
            $element = $(element);

            options.mouseWheel = options.mouseWheel || true;
            options.theme = options.theme || 'dark-thick';
            options.autoHideScrollbar = options.autoHideScrollbar || true;
            options.mouseWheelPixels = options.mouseWheelPixels || 'auto';
            options.horizontalScroll = options.horizontalScroll || false;
            options.advanced = options.advanced || {};
            options.advanced.autoExpandHorizontalScroll = options.horizontalScroll;
            options.advanced.updateOnContentResize = options.advanced.updateOnContentResize || true;
            options.advanced.updateOnBrowserResize = options.advanced.updateOnBrowserResize || true;

	    options.scrollInertia = 800;
	    options.mouseWheelPixels = 300;
	    
            $element.mCustomScrollbar( options );

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $element.mCustomScrollbar("destroy");
            });
        }
    };
    
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

    return({});
});
