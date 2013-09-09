define( ['plugins/dialog','lib/viblio','lib/config','facebook'], function(dialog,viblio,config) {

    var protocol = ko.observable( location.protocol );
    var server   = ko.observable( location.hostname );
    var localhost = ko.observable( location.hostname );

    var port = ko.computed( function() {
	if ( protocol() == 'https:' )
	    return 443;
	else
	    return 80;
    }, this );

    var CREATE_ENDPT = ko.computed( function() {
	return protocol() + '//' + server() + ':' + port() + '/files/';
    }, this );

    function uploadChunk(blobOrFile, submit_url, start, end, total) {
	var xhr = new XMLHttpRequest();
	xhr.open("PATCH", submit_url, false);
	xhr.setRequestHeader('Offset', start);
	xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');
	xhr.onload = function(e) { 
            console.log('uploaded bytes: ' + (end  - start) + "/" + total); 
	};
	xhr.send(blobOrFile);
    }


    function uploadFile(blob, fn) {
	console.log( 'uploadFile()', blob );
	var BYTES_PER_CHUNK = 10 * 1024 * 1024; // 10MB chunk sizes.
	var SIZE = blob.size;

	var uuid = viblio.getUser().uuid;
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", CREATE_ENDPT(), false);
	xhr.setRequestHeader('Final-Length', SIZE);
	console.log(JSON.stringify({uuid: uuid, file: { Path: fn}}));
	xhr.send(JSON.stringify({uuid: uuid, file: { Path: fn}}));
	submit_url = xhr.getResponseHeader("Location");
	console.log("new post url " + submit_url);
	
        
	blob.slice = blob.slice || blob.mozSlice || blob.webkitSlice;

	var start  = 0;
	var end  = 0;
	var startTime = new Date().getTime()/1000;
	var speed = 0;
	var notes = '';
	while(start < SIZE) {
            end = start + BYTES_PER_CHUNK;
            if (end  >  SIZE) {
		end = SIZE;
            }
            var chunk = blob.slice(start, end);
            uploadChunk(chunk, submit_url, start, end, SIZE);
            notes += '<br>uploaded ' + start  + "-" + (end - 1) + "/" + SIZE + "  chunk size:" + chunk.size;
            document.getElementById('notes').innerHTML = notes;
            console.log(notes);
            start += chunk.size;
	}
	var elapsedTime = new Date().getTime()/1000 - startTime;
	console.log("elapsed Time " + elapsedTime);
	speed = (SIZE * 8.0) / elapsedTime;
	console.log("speed " + speed);

	document.getElementById('speed').innerHTML = speed > 1024 * 1024 ? (speed/(1024 * 1024) + " Mbps") :( speed/1024 + "Kbps");
	document.getElementById('t').innerHTML = elapsedTime > 60 ? (elapsedTime/(60) + " mins"): (elapsedTime + " secs");
    }

    return {
	displayName: 'Media Upload',
	uploadFile: uploadFile,
	protocol: protocol,
	server: server,
	port: port,
	localhost: localhost,
	endpoint: CREATE_ENDPT,
	compositionComplete: function( view ) {
	    $('input[type="file"]').on( 'change input', function(ev) {
		uploadFile( ev.target.files[0], $(this).val() );
	    });
	}
    };
});
