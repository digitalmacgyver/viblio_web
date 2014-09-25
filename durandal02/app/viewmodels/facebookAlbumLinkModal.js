define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'facebook'], function( router, app, system, config, viblio, dialog ) {
    
    var S = function() {
	var self = this;
        
	self.cut_and_paste_url = ko.observable();
    };
    
    S.prototype.closeModal = function() {
        dialog.close(this);
    };
    
    S.prototype.copyToClipboard = function() {
        system.log("Here is the shareLink: " + $('.shareLink').val());
    };
    
    S.prototype.activate = function( link ) {
	var self = this;
        
        self.cut_and_paste_url( link );
    };
    
    S.prototype.deactivate = function() {
	// Remove flash object for copy-to-clipboard
	this.clip.destroy();
    };
        
    S.prototype.compositionComplete = function( view, parent ) {
        var self = this;
	self.view = view;
        
        console.log( self.cut_and_paste_url() );
        
        // Sets up placeholder compatability for IE when needed
        $('input, textarea').placeholder();
        
	// This is the copy-to-clipboard support
	var viblio = require( 'lib/viblio' );

	ZeroClipboard.setMoviePath( 'lib/zeroclipboard/ZeroClipboard11.swf' );	
	self.clip = new ZeroClipboard.Client();
	self.clip.addEventListener( 'complete', function( client, text ) {
	    viblio.mpEvent( 'Facebook album share' );
            viblio.mpPeopleIncrement('FB album shares from Browser', 1);
	});
	self.clip.setText( self.cut_and_paste_url() );
        self.clip.glue( 'copyFBLink', 'facebookAlbumLinkModal' );
    };

    return S;
});
