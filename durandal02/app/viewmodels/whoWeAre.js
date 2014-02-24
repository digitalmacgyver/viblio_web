define( ['plugins/router',
         'lib/viblio',
         'viewmodels/mediafile',
         'durandal/app',
         'durandal/events',
         'durandal/system',
         'lib/customDialogs',
         'plugins/dialog'], 
     
function( router,viblio, Mediafile, app, events, system, customDialogs, dialog ) {
    
    var teamMembers = ko.observableArray([
        {
            name: 'Mona Sabet',
            title: 'Co-founder and Chief Amplifier',
            imageName: 'mona-sabet.jpg',
            desc: 'With an engineering degree, a law degree and over 20 years of professional work experience at software\n\
                 companies and law firms, Mona is a seasoned executive and entrepreneur. Mona’s years of work at software\n\
                 automation companies gave her the idea to apply software automation to organizing her own chaotic collection\n\
                 of personal videos. Prior to founding Viblio, Mona served as Corporate Vice President, Business Development at\n\
                 Cadence Design Systems, a public global software company. At Cadence, Mona led all acquisitions, strategic technology\n\
                 transactions and venture investments, delivering tens of millions of dollars in incremental revenue to Cadence. Mona\n\
                 joined Cadence from Coverity, where she served on the executive management team, with oversight for worldwide legal and\n\
                 regulatory matters and responsibilities for initiating new growth programs.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/mona-sabet.jpg\")'>"
        },
        {
            name: 'Matthew Hayward',
            title: 'Head of Data and Analysis',
            imageName: 'matthew-hayward.jpg',
            desc: 'Matt built the professional services organizations from the ground up at software startups Delphix (agile data management)\n\
                and Coverity (development testing). His interest in databases, scalability, and software quality grew out of his work as a database\n\
                engineer at Amazon.com where he was responsible for the web facing shopping cart databases. Matt lives in San Mateo with his wife\n\
                Kristen. His love of mathematics, optimization, and a good story finds outlet in card, board, and role playing games. He holds BS\n\
                degrees in mathematics and physics, and a MS in computer science from the University of Illinois at Urbana-Champaign.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/matthew-hayward.jpg\")'>"
        },
        {
            name: 'Andrew Peebles',
            title: 'Architectural Advisor',
            imageName: 'andrew-peebles.jpg',
            desc: 'Andy has been designing and coding web technology platforms for the past 10 years. He built and ran the engineering infrastructure\n\
                at various technology companies such as Mips, SGI, StratumOne, and Cisco over the last 20 years. Andy enjoys the creativity of coming up\n\
                with solutions to difficult technology problems. He has a love for product designs that people love to use.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/andrew-peebles.jpg\")'>"
        },
        {
             name: 'Ramsri Golla',
             title: 'Software Developer, Computer Vision',
             imageName: 'ramsri-golla.jpg',
             desc: 'Ramsri is a recent masters’ graduate in image and signal processing from Arizona State University. He decided to get into the field because\n\
                  it made the best practical use of all the high school math he had to learn. In the end, he found he loved the industry. Check out Ramsri’s\n\
                  popular Youtube video explaining face detection! With the launch of Viblio, Ramsri plans on creating more videos and organizing and sharing\n\
                  them through the new Viblio platform! Ramsri loves to explore his non-technical side during weekends with skateboarding, hip-hop dancing and blogging.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/ramsri-golla.jpg\")'>"
         },
        {
            name: 'Alexander Black',
            title: 'Head of Products',
            imageName: 'alex-black.jpg',
            desc: 'Alex brings to Viblio 15 years of experience in nearly every specialization associated with film and web application design, development\n\
                deployment and testing. He runs a web and mobile app product development firm called Turing, and is also a managing director of Colorflow, post\n\
                production facility specializing in DCI 4K DI Color Grading, HD finishing, DCI Mastering and Data Archiving.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/alex-black.jpg\")'>"
        },
         {
            name: 'Jesse Garrison',
            title: 'Front-end Developer',
            imageName: 'jesse-garrison.jpg',
            desc: 'Jesse loves the world of startups, cool projects and front-end development. He grew up with a love for technology and a passion for problem\n\
                 solving. He first picked up web development for fun to help with a family project and quickly became hooked. He has been coding ever since.\n\
                 He enjoys turning ideas into functional and interactive experiences. When he’s not busy coding, he enjoys skiing, surfing and traveling the\n\
                 world on the never ending search for adventure.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/jesse-garrison.jpg\")'>"
        },
        {
            name: 'Bidyut Parruck',
            title: 'Technical Advisor',
            imageName: 'bidyut-parruck.jpg',
            desc: 'Bidyut is a serial entrepreneur having founded four companies prior to starting Viblio. He has deep expertise in\n\
                 networking, telecommunications and video delivery. He has taken on multiple technical and business roles including\n\
                 running product and business organizations.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/bidyut-parruck.jpg\")'>"
        },
        {
             name: 'Ali Zandifar',
             title: 'Computer Vision Advisor',
             imageName: 'ali-zandifar2.jpg',
             desc: 'Ali Zandifar is an expert in video and image content-based filtering and interactive video analytics.  He has built large-scale internet-based\n\
                computer vision applications at numerous companies.  He lives in San Francisco and enjoys travelling and capturing good times with videos!',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/ali-zandifar.jpg\")'>"
         },
        {
            name: 'Jason Catchpole',
            title: 'Technical Advisor, Computer Vision',
            imageName: 'jason-catchpole.jpg',
            desc: 'Jason is an experienced software engineer with a PhD in computer vision and augmented reality. He is currently a software lead at LayerX\n\
                 Limited, a company that innovates software and technology solutions through rapid application development. Prior to LayerX, Jason lead\n\
                 computer vision initiatives at Tandberg, which was acquired by Cisco in 2010. Jason relishes coming up with new and innovative solutions\n\
                 to difficult problems, generating new ideas for products/features, and taking existing algorithms from the research lab to the field. He has\n\
                 his head in the clouds and his feet on the ground.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/jason-catchpole.jpg\")'>"
        },
        {
            name: 'Greg Mori',
            title: 'Technical Advisor, Computer Vision',
            imageName: 'greg-mori.jpg',
            desc: 'Greg Mori is a computer vision professor at Simon Fraser University in Canada, specializing in video analysis. His research focuses on\n\
                 automatically interpret images and videos, particularly those containing people. Greg received his PhD in Computer Science from the University\n\
                 of California at Berkeley, and is widely published. He is a proud father of two, with the consequent mass of video data that Viblio is helping to organize!',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/greg-mori.jpg\")'>"
        },
        {
            name: 'Mike Solomon',
            title: 'Technical Advisor, Video Processing and Scalability',
            imageName: 'mike-solomon.jpg',
            desc: 'Mike Solomon was part of the initial team for a number of Internet companies that became some of the largest websites in the world, including Paypal\n\
                 and YouTube. At YouTube, Mike developed a focus on distributed systems and on improving the efficiency of Youtube\'s MySQL infrastructure.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/mike-solomon.jpg\")'>"
        },
        {
            name: 'Joe Chernesky',
            title: 'Advisory Board Member',
            imageName: 'joe-chernesky.jpg',
            desc: 'Joe is Senior Vice President, Intellectual Property and Innovation at The Kudelski Group, a Swiss public company and world leader in video and security\n\
                 solutions, a Board member of OpenTV, and Board Advisor to several technology companies in the San Francisco Bay Area. Joe has held executive and management\n\
                 positions with Intellectual Ventures, Boeing and Intel, and was co-founder and President of IPotential, a leading provider of Intellectual Property services.\n\
                 Joe earned a BS and MBA from the University of Arizona and served for ten years as a US Naval Officer in various active and reserve assignments throughout the world.',
            imageHTML: "<div class='teamMember-image-innerWrap' style='background-image: url(\"css/images/whoWeAre/joe-chernesky.jpg\")'>"
        }
    ]);
    
    showColor = function( data, e ) {
        $(e.target).parents('div.teamMember-Wrap').find('div.teamMember-image-innerWrap').toggleClass('desaturate');
    }
    
    showInfo = function( data, e ) {
        customDialogs.showModal('viewmodels/whoWeAreProfile', data);
    }
    
    fixLayout = function() {
        var ww = $( window ).width();
        
        if ( ww > 1440 ) {
            teamMembers().forEach( function( member ) {
                if ( teamMembers().indexOf(member) == 0 || teamMembers().indexOf(member) == 1 || teamMembers().indexOf(member) == 2 || teamMembers().indexOf(member) == 3 ||
                     teamMembers().indexOf(member) == 8 || teamMembers().indexOf(member) == 9 || teamMembers().indexOf(member) == 10 || teamMembers().indexOf(member) == 11 ) {
                    member.style('leftAligned');
                } else {
                    member.style('rightAligned');
                }    
            });
        } else if ( ww > 1080 ) {
            teamMembers().forEach( function( member ) {
                if ( teamMembers().indexOf(member) == 0 || teamMembers().indexOf(member) == 1 || teamMembers().indexOf(member) == 2 ||
                     teamMembers().indexOf(member) == 6 || teamMembers().indexOf(member) == 7 || teamMembers().indexOf(member) == 8) {
                    member.style('leftAligned');
                } else {
                    member.style('rightAligned');
                }    
            });
        } else if ( ww > 720 ) {
            teamMembers().forEach( function( member ) {
                if ( teamMembers().indexOf(member) == 0 || teamMembers().indexOf(member) == 1 ||
                     teamMembers().indexOf(member) == 4 || teamMembers().indexOf(member) == 5 ||
                     teamMembers().indexOf(member) == 8 || teamMembers().indexOf(member) == 9  ) {
                    member.style('leftAligned');
                } else {
                    member.style('rightAligned');
                }    
            });
        } else {
            teamMembers().forEach( function( member ) {
                if ( teamMembers().indexOf(member) % 2 == 0 ) {
                    //For even indexes
                    member.style('leftAligned');
                } else {
                    //for odd indexes
                    member.style('rightAligned');
                }    
            });
        }
    };
    
    return {
        teamMembers: teamMembers,
        
        showColor: showColor,
        
        binding: function() {
            teamMembers().forEach( function( member ) {
                member.style = ko.observable();
            });
            fixLayout();
        },
               
        compositionComplete: function() {
            $('.teamMember-Wrap').on('hover', function(){
                $(this).toggleClass('desaturate');
            });
            
            $(window).bind('resize', fixLayout);
        },
        
        detached: function() {
            $(window).unbind('resize', fixLayout);
        }
        
    };	
});