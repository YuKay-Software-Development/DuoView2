var hostname = 'minecraft.yukay.info';
var port = '9090';

$(document).ready(function()
{
    var video = $('#sharedVideo').get(0);
    var user_id;
	var sync = false;
	var sendpermplay = true;
	var sendpermpause = true;
	var sendpermseeked = true;
    video.preload = "auto";
    video.load();

    subscribeEvents();

    websocket = new WebSocket('ws://' + hostname + ':' + port + '/'); 
	
    websocket.onopen = function(event) 
    {
        notifyUser("Listening for events at: " + event.currentTarget.url + ".");
    };

	
	
    websocket.onmessage = function(event) 
    {
        var message = JSON.parse(event.data);
        var action = message.action;

        if(message.error != undefined)
        {
            notifyUser(message.error, 'red');
			
            return;
        }

        if(user_id == undefined)
        {
            user_id = message.user_id;
			$('#Id').text("User_ID " + user_id);
            
            sync = true;
            websocket.send(JSON.stringify(
            {
                action: 'sync_request',
            }));
        }

        if(user_id == message.user_id)
        {
			$('#Id').text("User_ID " + user_id);
            return;
        }


        switch(action)
        {
            case "notifyUser":
                notifyUser("Server: " + message.notice);
			break;
            
            case "play":
                safePlay(video);

                notifyUser("User_id " + message.user_id + " played the video.");
            break;

            case "pause":
                safePause(video);
                safetime(video, message.time);

                notifyUser("User_id " + message.user_id + " paused the video.");
            break;

            case "seeked":
                safeTime(video, message.time);

                notifyUser("User_id " + message.user_id + " seeked the video to " + message.time + ".");
            break;

            case "select":
                video.src = message.video;
                video.load();

                notifyUser("User_id " + message.user_id + " selected the video: " + message.video, 'blue');
            break;
			
			case "nosync":
                sync = false;
                notifyUser("Server: " + message.notice);
            break;
			
			case "syncRequest":
                websocket.send(JSON.stringify(
                {
                    action: 'sync',
                    time: video.currentTime,
                    video: video.src,
                    paused: video.paused
                }));   
				notifyUser("User_id " + message.user_id + " Requested Synchronization");
			break;
				
			case "dummy":
				sync = false;
				notifyUser("You can't sync with yourself, dummy!", "red");	
            break;
			
			case "sync":
                if (sync == true)
				{
					notifyUser("Synchronized with User_id" + message.user_id);
					if (video.src != message.video)
                    {
                        video.src = message.video;
                    }
					safeTime(video, message.time);
                    if (message.paused == true)
                    {
                        safePause(video);
                    }
                    else if (message.paused == false)
                    {
                        safePlay(video);
                    }
				}
                sync = false;
            break;
        }
    };

    $('#selectVideo').click(function()
    {
        video.src = $('#requestUrl').val();

        websocket.send(JSON.stringify(
        {
            action: 'select',
            video: video.src
        }));
    });
	
	$('#syncVideo').click(function()
    {
		sync = true;
        websocket.send(JSON.stringify(
        {
            action: 'sync_request',
        }));
    });
    
    $('#makeMaster').click(function()
    {	
        websocket.send(JSON.stringify(
        {
            action: 'make_master',
        }));
		
    });

    function subscribeEvents()
    {
        //notifyUser("on")
        $(video).on("play", onPlay);
        $(video).on("pause", onPause);
        $(video).on("seeked", onSeeked);
    }

    function onPause()
    {
		if (sendpermpause){
			websocket.send(JSON.stringify(
			{
				action: 'pause',
				time: this.currentTime
			}));
		}else{
			sendpermpause = true;
		}
    }

    function onPlay()
    {
		if (sendpermplay){
			websocket.send(JSON.stringify(
			{
				action: 'play'
			}));
		}else{
			sendpermplay = true;
		}
    }

    function onSeeked()
    {
		if (sendpermseeked){
			websocket.send(JSON.stringify(
			{
				action: 'seeked',
				time: this.currentTime
			}));
		}else{
			sendpermseeked = true;
		}
    }
	
	function safePlay(tvideo)
	{
		sendpermplay = false;
		tvideo.play();
	}
	
	function safePause(tvideo)
	{
		sendpermpause = false;
		tvideo.pause();
	}
	
	function safeTime(tvideo, ttime)
	{
		sendpermseeked = false;
		tvideo.currentTime = ttime;
	}

    function notifyUser(message, color = 'black')
    {
        $('#actions').prepend('<p style="color: ' + color + '; margin: 0px;">' + message + '</p>');
    }
});
