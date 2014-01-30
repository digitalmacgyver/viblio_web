(function($) {
    $.widget( 'viblio.viblio_player', {
	options: {
	    // The platform.  Use 'staging' for initial testing, 'production' when you deploy.
	    platform: 'production',
	    //
	    // How many video files to fetch for each page of infinite scroll.  Should be 2-3 times what
	    // fits in the area alloted.  Set to a huge number to effectively disable infinite scroll.
	    items_per_page: 13,
	    //
	    // Set to true for a curator view
	    curator: false,
	    //
	    // Set to true if curator is looking at the pending queue
	    pending: false,
	    //
	    // Show video titles at bottom of player popup
	    show_titles: true,
	    //
	    // Display Viblio branding.  PLEASE CONTACT VIBLIO before setting this to false.
	    branded: true,
	    //
	    // Use this to capture analytics.  If set to a function, when a video is played, you will
	    // get called with one parameter; an object that looks like:
	    // { userid: 'your-logged-in-users-id',
	    //   mid:    'the viblio medifile uuid',
	    //   title:  'the title of the video played'
	    // }
	    play_callback: null,
	},
	_create: function() {
	    var self = this;
	    var elem = self.element;

	    if ( self.options.platform == 'staging' )
		self.cf_domain = 's2gdj4u4bxrah6.cloudfront.net';
	    else
		self.cf_domain = 's3vrmtwctzbu8n.cloudfront.net';

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
				var m = $( ich.mediafile( mf ) );
				if ( self.options.show_titles ) {
				    m.find('.fancybox').attr('title', mf.title );
				}
				elem.append( m );
				self._apply( m.find('.fancybox') );
				m.on( 'mouseover.VP', function() {
				    m.find('.slide-up').animate({height: '100px'});
				});
				m.on( 'mouseleave.VP', function() {
				    m.find('.slide-up').animate({height: '0px'});
				});
				m.find('.slide-up .play').on('click.VP', function() {
				    m.find('.fancybox').click();
				});
				self._setup_buttons( m );
			    });
			},
			function( err ) {
			    alert( err.message );
			}
		    );
	    }
	},
	_setup_buttons: function( m ) {
	    var self = this;
	    if ( self.options.curator ) {
		if ( self.options.pending ) {
		    m.find('.slide-up .remove').css( 'display', 'inline-none' );
		    m.find('.slide-up .accept').css( 'display', 'inline-block' );
		    m.find('.slide-up .accept').on( 'click.VP', function() {
			self._accept( m );
		    });
		    m.find('.slide-up .reject').css( 'display', 'inline-block' );
		    m.find('.slide-up .reject').on( 'click.VP', function() {
			self._reject( m );
		    });
		}
		else {
		    m.find('.slide-up .accept').css( 'display', 'none' );
		    m.find('.slide-up .reject').css( 'display', 'none' );
		    m.find('.slide-up .remove').css( 'display', 'inline-block' );
		    m.find('.slide-up .remove').on( 'click.VP', function() {
			self._remove( m );
		    });
		}
	    }
	},
	_accept: function( m ) {
	},
	_reject: function( m ) {
	},
	_remove: function() {
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
		helpers : {
		    title : {
			type: 'inside'
		    }
		},
		openEffect: 'fade',
		closeEffect: 'elastic',
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
			      onStart: function( clip ) {
				  if ( self.options.play_callback ) {
				      self.options.play_callback({
					  userid: viblio.uid(),
					  mid: elem.data('mid'),
					  title: elem.attr( 'title' )
				      });
				  }
			      },
			  },
			  plugins: {
			      // Cloudfront
			      rtmp: {
				  url: 'vendor/flowplayer/flowplayer.rtmp-3.2.12.swf',
				  netConnectionUrl: 'rtmp://' + self.cf_domain + '/cfx/st'
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
		},

		afterShow: function() {
		    if ( self.options.branded ) {
			$('<div class="vp-logo"><a href="https://viblio.com" title="Powered by Viblio"><img src="img/viblioWhite.png" /></a></div>').appendTo( this.outer );
		    }
		}
	    });
	},
	_destroy: function() {
	    this.element.unbind( 'mouseover.VP' );
	    this.element.unbind( 'mouseleave.VP' );
	    this.element.unbind( 'click.VP' );
	    this.element.unbind( 'scroll.VP' );
	    flowplayer().unload();
	},
	refresh: function() {
	    var self = this;
	    self.pager = { 
		next_page: 1,
		entries_per_page: self.options.items_per_page,
		total_entries: -1 };
	    self.element.unbind( 'mouseover.VP' );
	    self.element.unbind( 'mouseleave.VP' );
	    self.element.unbind( 'click.VP' );
	    self.element.empty();
	    self._search();
	},
	_mediafile_template: function() {
	    return '\
<div class="vp-media"> <div>\
  <i class="icon-play-circle"></i> \
  <a class="fancybox vp-media-poster" \
     data-cf="{{ views.main.cf_url }}" \
     data-url="{{ views.main.url }}" \
     data-mid="{{ uuid }}" \
     href="#{{ uuid }}"> \
    <img src="{{ views.poster.url}}" width=240 height=135 /> \
  </a> \
  <div class="slide-up"> \
    <div>\
      <table>\
        <tr><td>Contributor:</td><td>Andrew Peebles</td></tr>\
        <tr><td>Recorded:</td><td>{{ recording_date }}</td></tr>\
      </table>\
      <div class="buttons"> \
        <a class="accept btn btn-mini btn-success">accept&nbsp;<i class="icon-check"></i></a>\
        <a class="reject btn btn-mini btn-warning">reject&nbsp;<i class="icon-ban-circle"></i></a>\
        <a class="remove btn btn-mini btn-danger">remove&nbsp;<i class="icon-remove-circle"></i></a>\
        <a class="play   btn btn-mini btn-info">play&nbsp;<i class="icon-play-circle"></i></a>\
      </div> \
    </div> \
  </div> \
  <div class="information"> \
    <div class="aux pull-right muted"> \
      <img src="img/viewsEye.png" /> \
      <span>{{ view_count }}</span> \
    </div> \
    <div class="title vidTitle truncate">{{ title }}</div> \
  </div> \
</div> </div>\
';
	}
    });
})(jQuery);
