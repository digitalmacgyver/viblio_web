define( ['plugins/router', 
	 'durandal/app', 
	 'durandal/system', 
	 'lib/config', 
	 'lib/viblio', 
	 'lib/customDialogs',
         'viewmodels/landingUploader'], 
function( router, app, system, config, viblio, dialogs, Uploader ) {

    var UL = ko.observable();

    return {
        UL: UL,
        
        compositionComplete: function( view ) {
            var self = this;
            
            UL(  new Uploader()  );
        }

    };
});
