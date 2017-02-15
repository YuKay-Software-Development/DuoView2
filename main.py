# Author: Trevi Awater & Luke Paris modified by Kayne Saridjo and Olivier Schipper

import json
import random

from websocket_server import WebsocketServer

master = 0
video = 0
users = []

def setmaster(client):
    global master
    master = client
    server.send_message_to_all(json.dumps({"action": "notifyUser", "notice": str(master["id"]) + " was assigned master"}))
    print("User %s is now master" % master["id"])

def new_client(client, server):
    global users
    server.send_message(client, json.dumps({"user_id": client["id"]}))
    server.send_message_to_all(json.dumps({"action": "notifyUser", "notice": str(client["id"]) + " joined the lobby"}))
    users.append(client)
    
def client_left(client, server):
    global users
    global master
    server.send_message_to_all(json.dumps({"action": "notifyUser", "notice": str(client["id"]) + " left the lobby"}))
    users.remove(client)
    if client == master:
        try:
            master = random.choice(users)
            #have to do it separatly otherwise it will try sending to the disconnected user
            for c in users:
                server.send_message(c, json.dumps({"action": "notifyUser", "notice": str(master["id"]) + " was assigned master"}))
            print("User %s is now master" % master["id"])
        except:
            master = 0
    
def got_message(client, server, message):
    message = json.loads(message)
    action = message["action"]
    
    
    if not action:
        server.send_message(client, json.dumps({"error": "No action provided."}))
        return

    if action == "pause":
        server.send_message_to_all(json.dumps({"action": "pause", "time": message["time"], "user_id": client["id"]}))
        return
        
    if action == "play":
        server.send_message_to_all(json.dumps({"action": "play", "user_id": client["id"]}))
        return

    if action == "seeked":
        server.send_message_to_all(json.dumps({"action": "seeked", "time": message["time"], "user_id": client["id"]}))
        return

    if action == "select":
        global video
        server.send_message_to_all(json.dumps({"action": "select", "video": message["video"], "user_id": client["id"]}))
        video = message["video"]
        return
      
    if action == "sync_request":
        if master != 0:
            if client == master:
                server.send_message(master, json.dumps({"action": "dummy"}))
            else:
                try:
                    server.send_message(master, json.dumps({"action": "syncRequest", "user_id": client["id"]}))
                except:
                    server.send_message(client, json.dumps({"action": "nosync", "notice": "Master has disconnected"}))
        else:
            server.send_message(client, json.dumps({"action": "nosync", "notice": "No master"}))
            setmaster(client)
        return
        
    if action == "sync":
        server.send_message_to_all(json.dumps({"action": "sync", "time": message["time"], "video": message["video"], "paused": message["paused"], "user_id": client["id"]}))
        return
    
    if action == "make_master":
        setmaster(client)
        return

server = WebsocketServer(9090, "0.0.0.0")
server.set_fn_message_received(got_message)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.run_forever()
