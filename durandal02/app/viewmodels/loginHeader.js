define( [], 
function() {
    
    var handleFixedHeader = function() {

            if (!window.addEventListener) {
        window.attachEvent( 'scroll', function( event ) {
                    if ($('body').hasClass("page-header-fixed") === false) {
                        return;
                    }
        if( !didScroll ) {
        didScroll = true;
        setTimeout( scrollPage, 250 );
        }
        });
            } else {
                window.addEventListener( 'scroll', function( event ) {
                    if ($('body').hasClass("page-header-fixed") === false) {
                        return;
                    }
                    if( !didScroll ) {
                        didScroll = true;
                        setTimeout( scrollPage, 250 );
                    }
                }, false );
            }
        var docElem = document.documentElement,
        header = $( '.navbar-inner' ),
        headerwrap = $( '.front-header' ),
        slider = $( '.slider-main' ),
        didScroll = false,
        changeHeaderOn = 300;

        function scrollPage() {
        var sy = scrollY();
        if ( sy >= changeHeaderOn ) {
                headerwrap.addClass('front-header-shrink');
                header.addClass('navbar-inner-shrink');
                $('#logoimg').attr('width', '120px');
                $('#logoimg').attr('height', '18px');
            } else {
                headerwrap.removeClass('front-header-shrink');
                header.removeClass('navbar-inner-shrink');
                $('#logoimg').attr('width', '142px');
                $('#logoimg').attr('height', '21px');
            }
            didScroll = false;
        }

        function scrollY() {
            return window.pageYOffset || docElem.scrollTop;
        }

    }

    var handleTheme = function () {
	
        var panel = $('.color-panel');
	
        // handle theme colors
        var setColor = function (color) {
            $('#style_color').attr("href", "assets/css/themes/" + color + (isRTL ? '-rtl' : '') + ".css");
            $('#logoimg').attr("src", "assets/img/logo_" + color + ".png");
            $('#rev-hint1').attr("src", "assets/img/sliders/revolution/hint1-" + color + ".png");
            $('#rev-hint2').attr("src", "assets/img/sliders/revolution/hint2-" + color + ".png");
        }

        $('.icon-color', panel).click(function () {
            $('.color-mode').show();
            $('.icon-color-close').show();
        });

        $('.icon-color-close', panel).click(function () {
            $('.color-mode').hide();
            $('.icon-color-close').hide();
        });

        $('li', panel).click(function () {
            var color = $(this).attr("data-style");
            setColor(color);
            $('.inline li', panel).removeClass("current");
            $(this).addClass("current");
        });
		
		$('.header-option', panel).change(function(){
			if($('.header-option').val() == 'fixed'){
	            $("body").addClass("page-header-fixed");
                $('.header').addClass("navbar-fixed-top").removeClass("navbar-static-top");
				App.scrollTop();
				
			} else if($('.header-option').val() == 'default'){
	            $("body").removeClass("page-header-fixed");
                $('.header').addClass("navbar-static-top").removeClass("navbar-fixed-top");
				$('.navbar-inner').removeClass('navbar-inner-shrink');
				$('.front-header').removeClass('front-header-shrink');
				App.scrollTop();
			}
		});
		
	}
    
    return {
        compositionComplete: function() {
            handleFixedHeader();
        }
    };
});
