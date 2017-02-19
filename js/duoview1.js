var hostname = 'minecraft.yukay.info';
var port = '9090';

$(document).ready(function()
{
    var video = $('#sharedVideo').get(0);
    var user_id;
	var name;
	var sync = false;
	var sendpermplay = true;
	var sendpermpause = true;
	var sendpermseeked = true;
	var receive = true;
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
			name = message.name;
			$('#Id').text(name);
            
			checkCookie();
			
            sync = true;
            websocket.send(JSON.stringify(
            {
                action: 'sync_request',
            }));
        }

        switch(action)
        {
            case "notifyUser":
                notifyUser(message.notice);
			break;
            
            case "play":
                safePlay(video);

                notifyUser(message.name + " played the video.");
            break;

            case "pause":
                safePause(video);
                safeTime(video, message.time);

                notifyUser(message.name + " paused the video.");
            break;

            case "seeked":
                safeTime(video, message.time);

                notifyUser(message.name + " seeked the video to " + message.time + ".");
            break;

            case "select":
                video.src = message.video;
                video.load();

                notifyUser(message.name + " selected the video: " + message.video, 'blue');
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
				notifyUser(message.name + " Requested Synchronization");
			break;
				
			case "dummy":
				sync = false;
				notifyUser("You can't sync with yourself, dummy!", "red");	
            break;
			
			case "sync":
                if (sync == true)
				{
					notifyUser("Synchronized with " + message.name);
					if (video.src != message.video)
                    {
                        video.src = message.video;
                    }
					safeTime(video, message.time);
                    if (message.paused == true)
                    {
                        video.pause();
                    }
                    else if (message.paused == false)
                    {
                        safePlay(video);
                    }
				}
                sync = false;
            break;
			
			case "chat":
				notifyUser(message.name + ": " + message.message, "#BB00BB");	
            break;
        }
    };

	$('#changeName').click(function()
    {
        name = $('#nameInput').val();
		$('#nameInput').val("");
		$('#Id').text(name);
		
        websocket.send(JSON.stringify(
        {
            action: 'changeName',
            name: name
        }));
		
		if (name != "" && name != null) {
			setCookie("username", name, 365);
		}
    });
	
	$('#send').click(function send()
    {
        var chat = $('#chatInput').val();
		$('#chatInput').val("");
		
        websocket.send(JSON.stringify(
        {
            action: 'chat',
            message: chat
        }));
    });
	
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
		document.getElementById('chatInput').addEventListener('keypress', handleKeyPressChat);
		document.getElementById('nameInput').addEventListener('keypress', handleKeyPressName);
    }

    function onPause()
    {
		if (sendpermpause){
			receive = false;
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
			receive = false;
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
			receive = false;
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
		if (receive){
			sendpermplay = false;
			tvideo.play();
		}else{
			receive = true;
		}
	}
	
	function safePause(tvideo)
	{
		if (receive){
			sendpermpause = false;
			tvideo.pause();
		}
	}
	
	function safeTime(tvideo, ttime)
	{
		if (receive){
			sendpermseeked = false;
			tvideo.currentTime = ttime;
		}else{
			receive = true;
		}
	}
	
	function handleKeyPressChat(e)
	{
		if (e.keyCode == 13)
		{
			var chat = $('#chatInput').val();
			$('#chatInput').val("");
		
			websocket.send(JSON.stringify(
			{
				action: 'chat',
				message: chat
			}));
		}
	}
	
	function handleKeyPressName(e)
	{
		if (e.keyCode == 13)
		{
			name = $('#nameInput').val();
			$('#nameInput').val("");
			$('#Id').text(name);
		
			websocket.send(JSON.stringify(
			{
				action: 'changeName',
				name: name
			}));
			
			if (name != "" && name != null) {
				setCookie("username", name, 365);
			}
		}
	}

    function notifyUser(message, color = 'black')
    {
        $('#actions').prepend('<p style="color: ' + color + '; margin: 0px;">' + message + '</p>');
    }
	
	function setCookie(cname, cvalue, exdays) {
		document.cookie = cname + "=" + cvalue + "; max-age=" + 60 * 60 * 24 * exdays +";path=/";
	}

	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	function checkCookie() {
		var user = getCookie("username");
		if (user != "") {
			name = user
			$('#Id').text(name);
			
			websocket.send(JSON.stringify(
			{
				action: 'changeName',
				name: name
			}));
		}
	}
});
