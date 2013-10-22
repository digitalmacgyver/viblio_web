define( ['plugins/router'], function( router ) {
    return {
            router: router,
            signin: function() {
                router.navigate( 'login' );
            }        
        };
});
