(function($) {
    $.widget( 'viblio.viblio_player', {
	options: {
	    cf_domain: 's2gdj4u4bxrah6.cloudfront.net'
	},
	_create: function() {
	    var self = this;
	    var elem = self.element;

	    self.sim = self._should_simulate();

	    viblio.api('/services/mediafile/list' ).then(
		function( data ) {
		    data.media.forEach( function( mf ) {
			var m = $('<a class="fancybox" data-cf="' + mf.views.main.cf_url + 
				  '" data-url="' + mf.views.main.url + 
				  '" href="#' + mf.uuid + '"' +
				  '" data-mid="' + mf.uuid + '">' + 
				  '<img src="' +
				  mf.views.poster.url +
				  '" width=120 height=90 />' +
				  '</a>');
			//m.on( 'click.VP', function() {
			//    var mid = m.attr( 'mid' );
			//    console.log( 'clicked on:', mid );
			//});
			elem.append( m );
		    });
		    self._apply();
		},
		function( err ) {
		    alert( err.message );
		}
	    );
	},
	_should_simulate: function() {
	    var videoel = document.createElement("video"),
            idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
            noflash = flashembed.getVersion()[0] === 0,
            simulate = !idevice && noflash &&
		!!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
            return simulate;
	},
	_apply: function() {
	    var self = this;
	    $('.fancybox').fancybox({
		tpl: {
		    // wrap template with custom inner DIV: the empty player container
		    wrap: '<div class="fancybox-wrap" tabIndex="-1">' +
			'<div class="fancybox-skin">' +
			'<div class="fancybox-outer">' +
			'<div id="player">' + // player container replaces fancybox-inner
			'</div></div></div></div>' 
		},
		
		beforeShow: function () {
		    var cf_url = $(this.element[0]).data( 'cf' );
		    var url    = $(this.element[0]).data( 'url' );
		    
		    // install player into empty container
		    var f = $("#player").flowplayer(
			{ src: "vendor/flowplayer/flowplayer-3.2.16.swf", wmode: 'opaque' },
			{ ratio: 9/16,
			  clip: {
			      url: 'mp4:' + cf_url,
			      ipadUrl: encodeURIComponent(url),
			      scaling: 'fit',
			      provider: 'rtmp',
			  },
			  plugins: {
			      // Cloudfront
			      rtmp: {
				  url: 'vendor/flowplayer/flowplayer.rtmp-3.2.12.swf',
				  netConnectionUrl: 'rtmp://' + self.options.cf_domain + '/cfx/st'
			      }
			  },
			  canvas: {
			      backgroundColor:'#254558',
			      backgroundGradient: [0.1, 0]
			  }
			}).flowplayer().ipad({simulateiDevice: self.sim});
		    $('#player').height(
			($('#player').width()*9)/16);
		    flowplayer().play(0);
		},
		beforeClose: function () {
		    // important! unload the player
		    flowplayer().unload();
		}
	    });
	}
    });
})(jQuery);
