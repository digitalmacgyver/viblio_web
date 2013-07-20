define(['durandal/app','durandal/widget','lib/config','lib/viblio','fancybox','flowplayer','flowplayer-ipad'],function(app,widget,config,viblio) {
    var videoel = document.createElement("video"),
    idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
    noflash = flashembed.getVersion()[0] === 0,
    simulate = !idevice && noflash &&
        !!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));

    var video = function( data ) {
	this.media = data;
	this.selected = ko.observable( false );
	this.view = null;
    };

    video.prototype.select = function(event) {
	var self = event.data;
	viblio.debug( 'media file selected: ' + self.media.uuid );
	self.selected( self.selected() ? false : true );
    };

    video.prototype.enterEditMode = function() {
	$(this.view).find( ".mplay-icon" ).hide();
        $(this.view).find( ".media-file").on( 'click', this, this.select );
    };

    video.prototype.exitEditMode = function() {
	$(this.view).find( ".mplay-icon" ).show();
        this.selected( false );
        $(this.view).find( ".media-file").off( 'click', this, this.select );
    };

    video.prototype.viewAttached = function( view ) {
	this.view = view;
	viblio.debug( 'in after render: ' + this.media.uuid );
	$(view).find(".fancybox").fancybox({
	    'transitionIn'	:	'elastic',
	    'transitionOut'	:	'elastic',
	    'speedIn'		:	600, 
	    'speedOut'		:	200, 
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
		}).flowplayer();
		// }).flowplayer().ipad({simulateiDevice: simulate});
		// THIS STOPPED WORKING!! Possible fix: http://flash.flowplayer.org/forum/4/75157
            },
            beforeClose: function () {
		// important! unload the player
		var fp = flowplayer(); 
		fp.unload();
            }
	});
    };

    return video;
});
