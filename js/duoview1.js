var hostname = '5.189.165.114';
var port = '9090';

$(document).ready(function()
{
    var video = $('#sharedVideo').get(0);
    var user_id;
	var sync = false;
	var sendperm = true;
    video.preload = "auto";
    video.load();

    subscribeEvents();

    websocket = new WebSocket('ws://' + hostname + ':' + port + '/'); 

    websocket.onopen = function(event) 
    {
        notifyUser("Listening for events at: " + event.currentTarget.url + ".");
		websocket.send(JSON.stringify(
        {
            action: 'joinsync',
        }));
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
            
            case "play":
				sendperm = false;
                video.play();

                notifyUser("User_id " + message.user_id + " played the video.");
            break;

            case "pause":
				sendperm = false;
                video.pause();
                video.currentTime = message.time;

                notifyUser("User_id " + message.user_id + " paused the video.");
            break;

            case "seeked":
				sendperm = false;
                video.currentTime = message.time;

                notifyUser("User_id " + message.user_id + " seeked the video to " + message.time + ".");
            break;

            case "select":
                video.src = message.video;
                video.load();

                notifyUser("User_id " + message.user_id + " selected the video: " + message.video, 'blue');
            break;
			
			case "syncRequest":
            
                if (sync == false && user_id == message.to_client)
                {
                    websocket.send(JSON.stringify(
                    {
                        action: 'sync',
                        time: video.currentTime,
                        video: video.src,
                        paused: video.paused
                    }));
                        
                }
                notifyUser("User_id " + message.user_id + " Requested Synchronization");
            break;
			
			case "sync":
                notifyUser("Yes")
                if (sync == true)
				{
					notifyUser("Synced with User_id" + message.user_id);
					if (video.src != message.video)
                    {
                        video.src = message.video;
                    }
                    video.src = message.video;
					video.currentTime = message.time;
                    if (message.paused)
                    {
                        video.pause();
                    }
                    elseif (!message.paused)
                    {
                        video.play();
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
		if (sendperm){
			websocket.send(JSON.stringify(
			{
				action: 'pause',
				time: this.currentTime
			}));
		}else{
			sendperm = true;
		}
    }

    function onPlay()
    {
		if (sendperm){
			websocket.send(JSON.stringify(
			{
				action: 'play'
			}));
		}else{
			sendperm = true;
		}
    }

    function onSeeked()
    {
		if (sendperm){
			websocket.send(JSON.stringify(
			{
				action: 'seeked',
				time: this.currentTime
			}));
		}else{
			sendperm = true;
		}
    }

    function notifyUser(message, color = 'black')
    {
        $('#actions').prepend('<p style="color: ' + color + '; margin: 0px;">' + message + '</p>');
    }
});