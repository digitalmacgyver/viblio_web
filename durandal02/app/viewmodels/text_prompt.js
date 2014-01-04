define([ 'plugins/router', 'plugins/dialog' ], function( router, dialog ) {

    var D = function( message, title, options, prompt ) {
	var self = this;

	self.title     = ko.observable( title );
	self.message   = ko.observable( message );
	self.options   = ko.observable( options );
	self.prompt    = ko.observable( prompt );
	self.help_text = ko.observable( options.help_text );
	self.focus     = ko.observable( true );
    };

    D.prototype.attached = function( view ) {
	this.view = view;
    },
    
    D.prototype.focusInput = function() {
        setTimeout(function(){
            $('#prompt').focus();
        },100);
    },

    D.prototype.compositionComplete = function() {
	this.focus( true );
        this.focusInput();
    },

    D.prototype.clearError = function() {
	$(this.view).find( '.control-group' ).removeClass( 'error' );
	this.help_text( this.options().help_text );
	this.prompt('');
	return true;
    },

    D.prototype.selectOption = function (dialogResult) {
	if ( this.options().verify ) {
	    var error = this.options().verify( dialogResult, this.prompt() );
	    if ( error ) {
		$(this.view).find( '.control-group' ).addClass( 'error' );
		this.help_text( error );
	    }
	    else {
		dialog.close(this, dialogResult, this.prompt() );
	    }
	}
	else {
            dialog.close(this, dialogResult, this.prompt() );
	}
    };

    D.prototype.close = function() {
	dialog.close( this );
	return true;
    };

    return D;
});
