define([
    'durandal/system', 
    'plugins/router',
    'lib/viblio', 
    'lib/customDialogs',
    'viewmodels/mediafile'], 
function( system, router, viblio, dialogs, Mediafile ) {

    var pager = {};

    function resetPager() {
	pager = {
	    next_page: 1,
	    entries_per_page: 20,
	    total_entries: -1
	};
    }
    resetPager();

    var media = ko.observableArray([]);
    var searching = ko.observable( true );
    var editLabel = ko.observable( 'Remove...' );

    var deleteModeOn = ko.computed( function() {
        if( editLabel() === 'Done' ) {
            return true;
        } else {
            return false;
        }
    });

    function search() {
	searching( true );
	return system.defer( function( dfd ) {
	    if ( pager.next_page ) {
		viblio.api( '/services/mediafile/popular', { views: ['poster'], page: pager.next_page, rows: pager.entries_per_page } ).then( function( data ) {
		    pager = data.pager;
		    data.media.forEach( function( mf ) {
			var m = new Mediafile( mf, { show_share_badge: true, show_delete_mode: deleteModeOn() } );
			m.on( 'mediafile:play', function( m ) {
			    router.navigate( 'new_player?mid=' + m.media().uuid );
			});
			m.on( 'mediafile:delete', function( m ) {
			    viblio.api( '/services/mediafile/delete', { uuid: m.media().uuid } ).then( function() {
				viblio.mpEvent( 'delete_video' );
				media.remove( m );
			    });
			});         
			
			media.push( m );
		    });
		    dfd.resolve();
		});
	    }
	    else {
		dfd.resolve();
	    }
	}).promise().then( function() {
	    searching( false );
	});
    }

    function scrollHandler( event ) {
        var self = event.data;
	if( !searching() && $(window).scrollTop() + $(window).height() > $(document).height() - 150 ) {
            search();
        }
    }

    return {
	media: media,
	searching: searching,
	editLabel: editLabel,

	toggleEditMode: function() {
	    var self = this;
            if ( editLabel() === 'Remove...' )
		editLabel( 'Done' );
            else
		editLabel( 'Remove...' );

	    media().forEach( function( m ) {
		m.toggleEditMode();
	    });
	},

	compositionComplete: function( view ) {
	    var self = this;
	    resetPager();
	    media.removeAll();
	    search();
	},

	add: function() {
            dialogs.showModal( 'viewmodels/nginx-modal' );
	},

	attached: function( view ) {
	    $(window).scroll( this, scrollHandler );
	},

	detached: function( view ) {
	    $(window).off( 'scroll', scrollHandler );
	    media.removeAll();
	}

    };

});
