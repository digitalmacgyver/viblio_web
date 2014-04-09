define( ['plugins/router', 'durandal/app', 'durandal/system', 'lib/config', 'lib/viblio', 'plugins/dialog', 'plugins/http', 'knockout'], function( router, app, system, config, viblio, dialog, http, ko ) {
    
    var clicks = ko.observable( 0 );
    
    var showThankYouModal = function() {
        if ( clicks() == 3 ) {
            dialog.show('viewmodels/ksThankYouModal');
        }
    };
     
    return {
        
        compositionComplete: function() {
            
            $('button').on('click', function() {
                clicks( clicks()+1 );
                var percent = Math.min(Math.round(clicks() / 3 * 100), 100);
                $('.percent').width(percent + '%');
                $('.number').text(percent + '%');
            });

            var ksurl = 'https://viblio.com';
            
            $('.facebook').on('click', function() {
                var w = 580, h = 300,
                        left = (screen.width/2)-(w/2),
                        top = (screen.height/2)-(h/2);


                    if ((screen.width < 480) || (screen.height < 480)) {
                        window.open ('http://www.facebook.com/share.php?u=' + ksurl, '', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
                    } else {
                        window.open ('http://www.facebook.com/share.php?u=' + ksurl, '', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);   
                    }
                    
                    showThankYouModal();
            });

            $('.twitter').on('click', function() {
                var loc = encodeURIComponent(ksurl),
                        title = "I’m supporting VIBLIO on Kickstarter.  Check it out.",
                        w = 580, h = 300,
                        left = (screen.width/2)-(w/2),
                        top = (screen.height/2)-(h/2);

                    window.open('http://twitter.com/share?text=' + title + '&url=' + loc, '', 'height=' + h + ', width=' + w + ', top='+top +', left='+ left +', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');
                    
                    showThankYouModal();
            });

            $('.linkedin').on('click', function() {
                var loc = encodeURIComponent(ksurl),
                        title = encodeURIComponent("I’m supporting VIBLIO on Kickstarter.  Check it out."),
                        source = encodeURIComponent('Kickstarter'),
                        w = 580, h = 550,
                        left = (screen.width/2)-(w/2),
                        top = (screen.height/2)-(h/2);

                    window.open('http://www.linkedin.com/shareArticle?mini=true&url=' + loc + '&title=' + title + '&source=' + source, 'social', 'height=' + h + ', width=' + w + ', top='+top +', left='+ left +', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');
                    
                    showThankYouModal();
            });
        }
    };
});
