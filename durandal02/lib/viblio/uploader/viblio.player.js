(function($) {
    $.widget( 'viblio.viblio_player', {
	options: {
	    cf_domain: 's2gdj4u4bxrah6.cloudfront.net',
	    items_per_page: 13,
	},
	_create: function() {
	    var self = this;
	    var elem = self.element;

	    self.pager = { 
		next_page: 1,
		entries_per_page: self.options.items_per_page,
		total_entries: -1 };

	    /* for flowplayer, use html5 player on mobile */
	    self.sim = self._should_simulate();
	    /* load templates */
	    ich.addTemplate( 'mediafile', self._mediafile_template() );

	    self.searching = false;
	    /* set up infinite scroll handler */
	    elem.on( 'scroll.VP', function() {
		if ( self.searching == true ) return;
		if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight)
		    self._search();
	    });
	    /* fetch mediafiles */
	    self._search();
	},
	_search: function() {
	    var self = this;
	    var elem = self.element;
	    if ( self.pager.next_page ) {
		self.searching = true;
		var loading = $('<span>Loading...</span>').appendTo( elem );
		viblio.api('/services/mediafile/list', 
			   { page: self.pager.next_page, 
			     rows: self.pager.entries_per_page } )
		    .then(
			function( data ) {
			    self.searching = false;
			    loading.remove();
			    self.pager = data.pager;
			    data.media.forEach( function( mf ) {
				var m = ich.mediafile( mf );
				elem.append( m );
				self._apply( m );
			    });
			},
			function( err ) {
			    alert( err.message );
			}
		    );
	    }
	},
	_should_simulate: function() {
	    var videoel = document.createElement("video"),
            idevice = /ip(hone|ad|od)/i.test(navigator.userAgent),
            noflash = flashembed.getVersion()[0] === 0,
            simulate = !idevice && noflash &&
		!!(videoel.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
            return simulate;
	},
	_apply: function( elem ) {
	    var self = this;
	    elem.fancybox({
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
	},
	_destroy: function() {
	    this.element.unbind( 'scroll.VP' );
	    flowplayer.unload();
	},
	_mediafile_template: function() {
	    return '\
<a class="fancybox vp-media" \
   data-cf="{{ views.main.cf_url }}" \
   data-url="{{ views.main.url }}" \
   data-mid="{{ uuid }}" \
   href="#{{ uuid }}"> \
  <img src="{{ views.poster.url}}" width=240 height=135 /> \
</a> \
';
	}
    });
})(jQuery);
