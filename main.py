# Author: Trevi Awater & Luke Paris modified by Kayne Saridjo and Olivier Schipper

import json

from websocket_server import WebsocketServer

master = 0
video = 0
users = []

def setmaster(client):
    global master
    master = client
    server.send_message_to_all(json.dumps({"action": "notifyUser", "notice": master["name"] + " was assigned master"}))
    print("%s is now master" % master["name"])

def new_client(client, server):
    global users
    client["name"] = "User " + str(client["id"])
    server.send_message(client, json.dumps({"user_id": client["id"], "name": client["name"]}))
    server.send_message_to_all(json.dumps({"action": "notifyUser", "notice": client["name"] + " joined the lobby"}))
    users.append(client)
    
def client_left(client, server):
    global users
    global master
    users.remove(client)
    for c in users:
        server.send_message(c, json.dumps({"action": "notifyUser", "notice": client["name"] + " left the lobby"}))
    if client == master:
        try:
            master = users[0]
            #have to do it separatly otherwise it will try sending to the disconnected user
            for c in users:
                server.send_message(c, json.dumps({"action": "notifyUser", "notice": master["name"] + " was assigned master"}))
            print("%s is now master" % master["name"])
        except:
            master = 0
    
def got_message(client, server, message):
    message = json.loads(message)
    action = message["action"]
    
    
    if not action:
        server.send_message(client, json.dumps({"error": "No action provided."}))
        return

    if action == "pause":
        server.send_message_to_all(json.dumps({"action": "pause", "time": message["time"], "name": client["name"]}))
        return
        
    if action == "play":
        server.send_message_to_all(json.dumps({"action": "play", "name": client["name"]}))
        return

    if action == "seeked":
        server.send_message_to_all(json.dumps({"action": "seeked", "time": message["time"], "name": client["name"]}))
        return

    if action == "select":
        global video
        server.send_message_to_all(json.dumps({"action": "select", "video": message["video"], "name": client["name"]}))
        video = message["video"]
        return
      
    if action == "sync_request":
        if master != 0:
            if client == master:
                for c in users:
                    if not c == master:
                        server.send_message(c, json.dumps({"action": "forceSync"}))
                server.send_message(master, json.dumps({"action": "notifyUser", "notice": "Forcing everyone to sync with master"}))
            else:
                try:
                    server.send_message(master, json.dumps({"action": "syncRequest", "name": client["name"]}))
                except:
                    server.send_message(client, json.dumps({"action": "nosync", "notice": "Master has disconnected"}))
        else:
            server.send_message(client, json.dumps({"action": "nosync", "notice": "No master"}))
            setmaster(client)
        return
        
    if action == "sync":
        server.send_message_to_all(json.dumps({"action": "sync", "time": message["time"], "video": message["video"], "paused": message["paused"], "name": client["name"]}))
        return
    
    if action == "make_master":
        setmaster(client)
        return
        
    if action == "changeName":
        users.remove(client)
        server.send_message_to_all(json.dumps({"action": "notifyUser", "notice": client["name"] + " is now known as " + message["name"]}))
        print(str(client["name"]) + " is now known as " + message["name"])
        client["name"] = message["name"]
        users.append(client)
        return
        
    if action == "chat":
        server.send_message_to_all(json.dumps({"action": "chat", "message": message["message"], "name": client["name"]}))
        return

server = WebsocketServer(9090, "0.0.0.0")
server.set_fn_message_received(got_message)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.run_forever()
