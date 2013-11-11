define(['plugins/router', 'durandal/app'], function (router, app) {
    return {
        router: router,
        activate: function () {
            router.map([
                { route: '', title:'Software Packages', moduleId: 'viewmodels/pkg', nav: true },
            ]).buildNavigationModel();
            
            return router.activate();
        }
    };
});