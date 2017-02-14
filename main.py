# Author: Trevi Awater & Luke Paris modified by Kayne Saridjo

import json

from websocket_server import WebsocketServer

master = 0
video = 0

def new_client(client, server):
    server.send_message(client, json.dumps({"user_id": client["id"]}))
    
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
        server.send_message_to_all(json.dumps({"action": "select", "video": message["video"], "user_id": client["id"]}))
        video = message["video"]
        return

    if action == "joinsync":
        server.send_message(client, json.dumps({"action": "joinsync", "video": video}))
        return
		
    if action == "sync_request":
        global master
        server.send_message_to_all(json.dumps({"action": "syncRequest", "to_client": master, "user_id": client["id"]}))
        print("SyncedReq")
        return
		
    if action == "sync":
        print("Synced")
        server.send_message_to_all(json.dumps({"action": "sync", "time": message["time"], "video": message["video"], "paused": message["paused"], "user_id": client["id"]}))
        return
    
    if action == "make_master":
        global master
        master = client["id"]
        server.send_message_to_all(json.dumps({"action": "notifyUser", "notice": str(client["id"]) + " was assigned master"}))
        return

server = WebsocketServer(9090, "0.0.0.0")
server.set_fn_message_received(got_message)
server.set_fn_new_client(new_client)
server.run_forever()
